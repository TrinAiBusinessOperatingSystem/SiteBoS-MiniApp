# 📐 ORDINE DI SERVIZIO: ALLINEAMENTO BACKEND PRODOTTI & SICUREZZA

Questo documento definisce le specifiche tecniche, i flussi logici e i prompt (System Instructions & Design Tasks) da importare nei workflow n8n per supportare il filtro Sicurezza e la generazione avanzata dei Prodotti finiti (`PRO`) con Distinta Base (BOM).

---

## 🛡️ 1. WORKFLOW: Secure_Assistant.json (Filtro Sicurezza - ODS2)

Nel nodo JavaScript Code chiamato **`catalog_active`** (ID: `aeaef888-c056-4d14-b0dd-a289d29ffea0`), aggiornare il codice per filtrare le voci in base al flag `show_in_security_assistant`.

### Codice da aggiornare nel nodo `catalog_active`:
```javascript
const catalogActiveArray = [];

for (const item of $input.all()) {
  try {
    const catalog = item.json.service_catalog;
    if (!catalog || !catalog.categories) continue;

    catalog.categories.forEach(category => {
      // Normalizzazione della macrocategoria
      let macro = (category.macrocategories || "").toUpperCase().trim();
      
      if (!macro) {
        const catName = (category.name || "").toUpperCase();
        if (catName.includes("[SOP]")) macro = "SOP";
        else if (catName.includes("[SER]")) macro = "SER";
        else if (catName.includes("[PRO]")) macro = "PRO";
      }

      // Esclude i Prodotti Finiti dall'assistente sicurezza
      if (macro === "PRO") {
        return; 
      }

      if (category.subcategories && Array.isArray(category.subcategories)) {
        category.subcategories.forEach(sub => {
          // FILTRO DI COMPLIANCE: Passa solo se show_in_security_assistant è true
          if (sub.show_in_security_assistant !== true) {
            return;
          }

          const flatItem = {
            service_sku: sub.callback_data,
            service_name: sub.name,
            categoria_padre: category.name,
            short_name: sub.short_name || sub.name,
            vertical: category.vertical || "common",
            blueprint_ready: sub.blueprint_ready || "false"
          };

          // Se è SOP o SER ed è abilitato esplicitamente, lo inserisce
          if (macro === "SOP") {
            catalogActiveArray.push(flatItem);
          } else if (macro === "SER") {
            if (sub.blueprint_ready === true) {
              catalogActiveArray.push(flatItem);
            }
          }
        });
      }
    });

  } catch (error) {
    return [{ 
      json: { 
        status: "ERROR", 
        message: "Errore durante l'elaborazione del catalogo filtrato", 
        details: error.message 
      } 
    }];
  }
}

return [{ json: { catalog_active: catalogActiveArray } }];
```

---

## ⚙️ 2. WORKFLOW: service_catalog.json (Toggle Sicurezza - ODS2)

Aggiungere un nuovo ramo nel nodo `Switch` principale per gestire l'azione `toggle_security`.

### Specifiche dell'Azione `toggle_security`:
1.  **Payload Ricevuto (POST Webhook):**
    ```json
    {
      "action": "toggle_security",
      "product_id": "SVC_XXXXXX",
      "vat_number": "XXXXXXXXXXX",
      "token": "XXXXXX",
      "_auth": "..."
    }
    ```
2.  **Passi del Workflow:**
    *   **Autorizzazione:** Eseguire il controllo standard su `owner_sessions` incrociando `vat_number` e `token` (come per le altre azioni).
    *   **Lettura Catalogo:** Recuperare il documento da `service_catalog` in `MemoryManager` dove `sessionId` è `[vat_number]_setup_ik`.
    *   **Codice JS di Inversione Flag:**
        Individuare la subcategory con `callback_data === product_id` e invertire il valore booleano di `show_in_security_assistant` (se non presente, impostarlo a `true`).
        *Esempio Codice:*
        ```javascript
        const categories = item.messages[0].data.categories;
        let newState = false;
        categories.forEach(cat => {
          if (cat.subcategories) {
            cat.subcategories.forEach(sub => {
              if (sub.callback_data === product_id) {
                sub.show_in_security_assistant = !(sub.show_in_security_assistant === true);
                newState = sub.show_in_security_assistant;
              }
            });
          }
        });
        return { categories, newState };
        ```
    *   **Salvataggio su MongoDB:** Eseguire un `$set` sull'intero array delle categorie o usare l'operatore posizionale per aggiornare solo l'elemento modificato nel documento `[vat_number]_setup_ik`.
    *   **Risposta Webhook:** Restituire `{ "status": "success", "new_state": newState }`.

---

## 📦 3. WORKFLOW: saveProduct_processor.json (Sdoppiamento Flusso & Prompts per PRO - ODS1)

Nel workflow di salvataggio del prodotto, sdoppiare il flusso di generazione del blueprint quando l'entità è di tipo `PRODUCT` o `PRO`. Invece di usare i nodi di generazione dei Servizi/SOP, inserire un ramo condizionale che punta ai nodi di creazione del **Blueprint di Prodotto (BOM & Assemblaggio)**.

Di seguito si riportano le System Instructions e i Prompts dei nodi da configurare in questo nuovo ramo.

### 📋 3.1 NODO: `product_BluePrint_product` (Generazione Blueprint Prodotto)

#### 🛡️ System Instruction:
```xml
<SystemInstruction>
<Role>Senior_Product_Operations_and_BOM_Architect</Role>
<CorePersona>
Sei il Direttore di Produzione (COO) e l'Ingegnere di Processo industriale del tenant. Il tuo compito è trasformare un prodotto fisico o pacchettizzato (TargetAsset) in un PROCESS_BLUEPRINT esecutivo per l'assemblaggio, specificando la distinta base (BOM) e i controlli di qualità logistici. Sei metodico, strutturato e orientato alla tracciabilità dei lotti e alla sicurezza della supply chain.
</CorePersona>

<GuidingPrinciples>
1. STRUTTURA DEL BLUEPRINT:
   Imposta "blueprint_type" obbligatoriamente su "PRODUCT_FLOW".
   Associa "service_sku" allo SKU del prodotto TargetAsset.

2. LE TRE FASI DI PRODUZIONE (STAGES OBBLIGATORI):
   - STAGE 1: APPROVVIGIONAMENTO E PREPARAZIONE KIT (stage_id: "STAGE_01")
     * Step per il prelievo dei semilavorati e delle materie prime dal magazzino.
     * Verifica di inventario e controllo integrità dei materiali.
     * Skill richieste: "Responsabile_Magazzino" o "Operatore_Produzione".
   - STAGE 2: ASSEMBLAGGIO E TRASFORMAZIONE FISICA (stage_id: "STAGE_02")
     * Step sequenziali per il montaggio, la cottura, l'impasto o l'assemblaggio fisico del prodotto.
     * Associa per ogni step i materiali/semilavorati aperti o consumati nell'array "materials".
     * Skill richieste: "Operatore_Produzione" o specialisti di linea.
   - STAGE 3: COLLAUDO, TRACCIABILITÀ E CONFEZIONAMENTO (stage_id: "STAGE_03")
     * Step obbligatorio di Controllo Qualità (quality_check) con verifica dell'evidenza (es. foto del prodotto finito o firma dell'operatore).
     * Step per l'assegnazione e apposizione del Numero di Lotto e scadenza.
     * Step per il confezionamento finale e stoccaggio nell'area prodotti finiti.
     * Skill richieste: "Addetto_Controllo_Qualita" o "Responsabile_Magazzino".

3. EVIDENCE TYPE (QUALITY CHECK):
   Configura controlli di qualità rigorosi nei passaggi critici dell'assemblaggio e del collaudo finale:
   - SIGNATURE: Autocertificazione di avvenuto assemblaggio a regola d'arte.
   - VISION: Foto live del prodotto assemblato o del lotto apposto.
   - FILE: Certificato di collaudo o scheda tecnica.
   - NONE: Solo per passaggi puramente logistici interni.
</GuidingPrinciples>

<OutputSchema>
{
  "blueprint": {
    "_id": "GENERATE_UNIQUE_ID",
    "document_type": "PROCESS_BLUEPRINT",
    "version": "1.0",
    "owner_instance_id": "{{ $json.owner_data.vat_number }}",
    "metadata": {
      "status": "ACTIVE",
      "created_at": "{{ new Date().toISOString() }}",
      "last_updated_at": "{{ new Date().toISOString() }}"
    },
    "service_sku": "{{ $json.new_product_block.identity.item_sku }}",
    "blueprint_name": "[PRO] - Blueprint di Assemblaggio e Produzione",
    "blueprint_description": "Protocollo dettagliato per il prelievo materiali, l'assemblaggio e il confezionamento del prodotto finito.",
    "blueprint_type": "PRODUCT_FLOW",
    "tags": ["Produzione", "BOM", "Assemblaggio", "Logistica"],
    "summary": {
      "estimated_total_cost": "Costo stimato totale (somma semilavorati + lavoro)",
      "estimated_total_time_minutes": 0,
      "bill_of_materials_summary": [
        { "material_sku": "string", "quantity": 1, "unit_of_measure": "unit" }
      ]
    },
    "stages": [
      {
        "stage_id": "STAGE_01",
        "stage_order": 1,
        "stage_name": "Approvvigionamento e Kit Preparazione",
        "description": "Fase di prelievo materie prime e semilavorati dal magazzino",
        "steps": [
          {
            "step_id": "STEP_01_01",
            "step_order": 1,
            "step_name": "Prelievo e Verifica Componenti",
            "instructions": "Prelevare dal magazzino i semilavorati e le materie prime indicate nella distinta base.",
            "estimated_time_minutes": 10,
            "resources_needed": {
              "labor": { "required_skill_tags": ["Responsabile_Magazzino"], "estimated_work_minutes": 10 },
              "materials": [],
              "assets": []
            },
            "quality_check": {
              "is_required": true,
              "evidence_type": "SIGNATURE",
              "check_description": "Firma per conferma prelievo e verifica conformità lotti in ingresso.",
              "acceptance_criteria": "Tutti i materiali presenti e integri."
            },
            "logistics_flags": {
              "requires_wip": true,
              "requires_finished": false
            }
          }
        ]
      }
    ]
  }
}
</OutputSchema>
</SystemInstruction>
```

#### 🎯 Design Task (Prompt):
```xml
<DesignTask>
Genera il Blueprint Operativo Ingegnerizzato per il prodotto TargetAsset (PRO), includendo la distinta base e le fasi di assemblaggio.

<TargetAsset>
  Name: {{ $json.new_product_block.identity.item_name }}
  Type: {{ $json.new_product_block.identity.item_type }}
  Desc: {{ $json.new_product_block.identity.description.long }}
  InternalNotes: {{ $json.new_product_block.identity.description.internal_notes }}
  BOM: {{ JSON.stringify($json.new_product_block.bom || []) }}
  Assets: {{ JSON.stringify($json.new_product_block.assets || []) }}
</TargetAsset>

<MaterialsAndSemilavorati>
  Componenti e semilavorati selezionati nella distinta base:
  {{ JSON.stringify($json.new_product_block.bom || []) }}
</MaterialsAndSemilavorati>

<Instruction>
1. CLASSIFICAZIONE DEL PROCESSO:
   - Imposta blueprint_type su PRODUCT_FLOW.
   
2. STRUTTURAZIONE DELLE FASI (STAGE 1, STAGE 2, STAGE 3):
   - Mappa con cura l'assemblaggio finale nello STAGE 2. Ogni step deve descrivere come unire o trasformare i semilavorati indicati in <MaterialsAndSemilavorati>.
   - Per ciascun componente usato in uno step, inserisci il suo SKU o nome nell'array "materials" dello step.
   
3. CONTROLLO QUALITÀ FINALE:
   - Nello STAGE 3, inserisci un passaggio obbligatorio di validazione con evidence_type "VISION" o "SIGNATURE" per certificare il lotto finale e l'integrità del confezionamento prima dello stoccaggio.
</Instruction>
</DesignTask>
```
