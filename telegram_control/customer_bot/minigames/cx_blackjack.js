/**
 * cx_blackjack.js — Mini Blackjack Engine (Puntata 5-40 pt, Rischio Finanziario)
 */

const CxBlackjack = (() => {
    'use strict';

    let deck = [];
    let playerHand = [];
    let dealerHand = [];
    let currentBet = 10;
    let gameActive = false;
    let handsHistory = [];

    function createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        deck = [];
        for (let s of suits) {
            for (let v of values) {
                let weight = parseInt(v);
                if (['J', 'Q', 'K'].includes(v)) weight = 10;
                if (v === 'A') weight = 11;
                deck.push({ suit: s, value: v, weight });
            }
        }
        deck.sort(() => Math.random() - 0.5);
    }

    function calculateScore(hand) {
        let score = hand.reduce((sum, card) => sum + card.weight, 0);
        let aces = hand.filter(c => c.value === 'A').length;
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    }

    function startHand(betAmount) {
        currentBet = Math.max(5, Math.min(40, Number(betAmount) || 10));

        if (window.CxGamificationHub && !window.CxGamificationHub.canSpend(currentBet)) {
            alert("Punti insufficienti per questa puntata! Guadagna punti prima di giocare.");
            return null;
        }

        if (window.CxGamificationHub) {
            window.CxGamificationHub.spendPoints(currentBet, 'blackjack_bet');
        }

        createDeck();
        playerHand = [deck.pop(), deck.pop()];
        dealerHand = [deck.pop(), deck.pop()];
        gameActive = true;

        return getGameState();
    }

    function hit() {
        if (!gameActive) return getGameState();
        playerHand.push(deck.pop());
        const pScore = calculateScore(playerHand);
        if (pScore > 21) {
            gameActive = false;
            recordHandResult('LOST');
        }
        return getGameState();
    }

    function stand() {
        if (!gameActive) return getGameState();
        gameActive = false;

        let dScore = calculateScore(dealerHand);
        while (dScore < 17) {
            dealerHand.push(deck.pop());
            dScore = calculateScore(dealerHand);
        }

        const pScore = calculateScore(playerHand);
        let result = 'LOST';

        if (dScore > 21 || pScore > dScore) {
            result = 'WON';
            const payout = Math.round(currentBet * 1.5);
            if (window.CxGamificationHub) {
                window.CxGamificationHub.addPoints(payout, 'blackjack_win');
            }
        } else if (pScore === dScore) {
            result = 'PUSH';
            if (window.CxGamificationHub) {
                window.CxGamificationHub.addPoints(currentBet, 'blackjack_push');
            }
        }

        recordHandResult(result);
        return getGameState();
    }

    function recordHandResult(result) {
        handsHistory.push({ bet: currentBet, result });
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred(result === 'WON' ? 'success' : 'warning');
        }
    }

    function getGameState() {
        return {
            playerHand,
            dealerHand: gameActive ? [dealerHand[0], { suit: '?', value: '?' }] : dealerHand,
            playerScore: calculateScore(playerHand),
            dealerScore: gameActive ? dealerHand[0].weight : calculateScore(dealerHand),
            gameActive,
            bet: currentBet
        };
    }

    function getStats() {
        const totalHands = handsHistory.length;
        const avgBet = totalHands > 0 ? handsHistory.reduce((a, h) => a + h.bet, 0) / totalHands : 0;
        const wins = handsHistory.filter(h => h.result === 'WON').length;
        return { totalHands, avgBet, winRate: totalHands > 0 ? wins / totalHands : 0 };
    }

    return { startHand, hit, stand, getGameState, getStats };
})();

if (typeof window !== 'undefined') {
    window.CxBlackjack = CxBlackjack;
}
