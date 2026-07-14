# 📐 ORDINE DI SERVIZIO: ALLINEAMENTO BACKEND PRODOTTI & SICUREZZA

Questo documento definisce le specifiche tecniche, i flussi logici e i prompt (System Instructions & Design Tasks) da importare nei workflow n8n per supportare il filtro Sicurezza e la generazione avanzata dei Prodotti finiti (`PRO`) con Distinta Base (BOM).

---
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
   - NONE: Solo per passaggi puramente logistici interni.<OutputSchema>
{
  "blueprint": {
    "_id": "<VAT_NUMBER>-<PRODUCT_SKU>",
    "document_type": "PROCESS_BLUEPRINT",
    "version": "1.0",
    "owner_instance_id": "{{ $json.owner_data.vat_number }}",
    "metadata": {
      "status": "ACTIVE",
      "created_at": "{{ new Date().toISOString() }}",
      "last_updated_at": "{{ new Date().toISOString() }}"
    },
    "service_sku": "{{ $json.new_product_block.identity.item_sku }}",
    "blueprint_name": "[PRO] - Blueprint di Assemblaggio e Confezionamento <Nome Prodotto>",
    "blueprint_description": "Descrizione sintetica del processo di assemblaggio per <Nome Prodotto>.",
    "blueprint_type": "PRODUCT_FLOW",
    "tags": ["Produzione", "BOM", "Assemblaggio", "Logistica"],
    "summary": {
      "estimated_total_cost": "<COSTO_TOTALE_DECIMALE> EUR",
      "estimated_total_time_minutes": "<TEMPO_TOTALE_INTERO>",
      "bill_of_materials_summary": [
        { "material_sku": "<SKU_COMPONENTE_1>", "quantity": 1, "unit_of_measure": "<U_M_1>" }
      ]
    },
    "stages": [
      {
        "stage_id": "STAGE_01",
        "stage_order": 1,
        "stage_name": "<Nome della prima fase logica o di preparazione>",
        "description": "<Descrizione di cosa accade in questa fase>",
        "steps": [
          {
            "step_id": "STEP_01_01",
            "step_order": 1,
            "step_name": "<Nome del primo step operativo>",
            "instructions": "<Istruzioni operative dettagliate su cosa fare e quali componenti della distinta base usare nello step>",
            "estimated_time_minutes": 5,
            "resources_needed": {
              "labor": { "required_skill_tags": ["<Ruolo_Richiesto>"], "estimated_work_minutes": 5 },
              "materials": [
                { "material_sku": "<SKU_COMPONENTE_DELLA_BOM>", "quantity": 1, "unit_of_measure": "<U_M>" }
              ],
              "assets": []
            },
            "quality_check": {
              "is_required": true,
              "evidence_type": "<SIGNATURE|VISION|NONE>",
              "check_description": "<Descrizione del controllo qualità da effettuare>",
              "acceptance_criteria": "<Criteri di accettabilità dello step per passare al successivo>"
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
   - Per ciascun componente della distinta base (BOM) usato in uno step, inserisci un oggetto con "material_sku", "quantity" e "unit_of_measure" nell'array "materials" dello step.
   
3. CONTROLLO QUALITÀ FINALE:
   - Nello STAGE 3, inserisci un passaggio obbligatorio di validazione con evidence_type "VISION" o "SIGNATURE" per certificare il lotto finale e l'integrità del confezionamento prima dello stoccaggio.
</Instruction>
</DesignTask>
```

---

## 🛠️ 4. WORKFLOW: editBlueprintProduct.json (Azione: CREATE_SEMILAVORATO)

Aggiungere un ramo dedicato nello switch del webhook di salvataggio/gestione blueprint per creare in tempo reale un semilavorato (`SOP`) nel catalogo.

### 📋 4.1 Payload Ricevuto (POST Webhook):
```json
{
  "action": "CREATE_SEMILAVORATO",
  "name": "Nome Nuovo Semilavorato",
  "vat_number": "ITXXXXXX",
  "token": "XXXXXX",
  "_auth": "..."
}
```

### ⚙️ 4.2 Step Logici del Workflow:
1. **Generazione SKU:**
   Generare un codice alfanumerico univoco nel formato `SVC_AUTO_[STRING_8_CHARS]`.
2. **Aggiornamento Documento Catalogo:**
   Recuperare il setup catalogo `[vat_number]_setup_ik` dalla collezione `service_catalog` in `MemoryManager`.
   * Trovare la categoria con `macrocategories === "SOP"`. Se non esiste, crearne una chiamata `"[SOP] Semilavorati"`.
   * Aggiungere alle `subcategories` della categoria trovata/creata il nuovo oggetto semilavorato:
     ```javascript
     {
       "callback_data": generatedSku,
       "name": name,
       "short_name": name,
       "blueprint_ready": false,
       "show_in_security_assistant": false
     }
     ```
   * Salvare il documento catalogo aggiornato su MongoDB.
3. **Inizializzazione Documento Blueprint vuoto:**
   Inserire nella collezione `product_blueprint` (o `sops`) un record DRAFT per consentire l'editing immediato:
   ```json
   {
     "service_sku": generatedSku,
     "blueprint_name": "[SOP] - Blueprint di " + name,
     "blueprint_description": "Fasi di lavorazione e preparazione del semilavorato " + name,
     "blueprint_type": "SOP_SEMILAVORATO",
     "stages": [],
     "summary": {
       "estimated_total_cost": "0.00 EUR",
       "estimated_total_time_minutes": 0,
       "bill_of_materials_summary": []
     },
     "metadata": {
       "status": "DRAFT",
       "created_at": new Date().toISOString(),
       "last_updated_at": new Date().toISOString()
     },
     "owner_instance_id": vat_number
   }
   ```
4. **Risposta Webhook:**
   Restituire in formato JSON:
   ```json
   {
     "status": "success",
     "sku": generatedSku,
     "name": name
   }
   ```
