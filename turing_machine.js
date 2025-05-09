class TuringMachine {
    constructor(tape = [], blankSymbol = 'B', initialState = 'q0', finalStates = new Set(['qf']), transitions = {}) {
        this.tape = [...tape];
        this.head = 0;
        this.blankSymbol = blankSymbol;
        this.currentState = initialState;
        this.finalStates = finalStates;
        this.transitions = transitions; // { "state,symbol": ["newState", "newSymbol", "action"] }
        this.steps = 0;
    }

    step() {
        if (this.finalStates.has(this.currentState)) {
            return { halted: true, finalStateReached: true, message: "Estado final alcançado!" };
        }

        const currentSymbol = this.tape[this.head] !== undefined ? this.tape[this.head] : this.blankSymbol;
        const transitionKey = `${this.currentState},${currentSymbol}`;
        const transition = this.transitions[transitionKey];

        if (!transition) {
            return { halted: true, error: `Transição não definida para: (${this.currentState}, ${currentSymbol})` };
        }

        const [newState, newSymbol, direction] = transition;

        if (this.head >= 0 && this.head < this.tape.length) {
            this.tape[this.head] = newSymbol;
        } else if (this.head === this.tape.length) {
            this.tape.push(newSymbol);
        } else {
             this.tape.unshift(newSymbol);
             this.head = 0;
        }
        
        this.currentState = newState;

        if (direction === 'L') {
            this.head--;
            if (this.head < 0) {
                this.tape.unshift(this.blankSymbol);
                this.head = 0;
            }
        } else if (direction === 'R') {
            this.head++;
            if (this.head === this.tape.length) {
                this.tape.push(this.blankSymbol);
            }
        }
        this.steps++;
        return { halted: false };
    }

    reset(tape = [], initialState = 'q0') {
        this.tape = [...tape];
        this.head = 0;
        this.currentState = initialState;
        this.steps = 0;
    }
}

// Lógica da Interface do Usuário (UI) com Animações
let tmInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-button').addEventListener('click', setupAndStartSimulation);
    document.getElementById('step-button').addEventListener('click', executeStep);
    document.getElementById('reset-button').addEventListener('click', resetSimulation);
    updateDisplay(); 
});

function parseTransitions(transitionsInput) {
    const parsed = {};
    transitionsInput.split('\n').forEach(line => {
        const parts = line.trim().split(',');
        if (parts.length === 5) {
            const key = `${parts[0].trim()},${parts[1].trim()}`;
            parsed[key] = [parts[2].trim(), parts[3].trim(), parts[4].trim().toUpperCase()];
        }
    });
    return parsed;
}

function setupAndStartSimulation() {
    const statesInput = document.getElementById('states').value;
    const alphabetInput = document.getElementById('alphabet').value;
    const blankSymbol = document.getElementById('blank_symbol').value;
    const initialState = document.getElementById('initial_state').value;
    const finalStatesInput = document.getElementById('final_states').value;
    const tapeInput = document.getElementById('input_string').value;
    const transitionsText = document.getElementById('transitions').value;

    if (!initialState || !blankSymbol || !tapeInput) {
        updateGameMessage("Erro: Estado inicial, símbolo branco e fita inicial são obrigatórios!", "error");
        return;
    }

    const finalStates = new Set(finalStatesInput.split(',').map(s => s.trim()).filter(s => s));
    const transitions = parseTransitions(transitionsText);
    const initialTape = Array.from(tapeInput);

    tmInstance = new TuringMachine([...initialTape], blankSymbol, initialState, finalStates, transitions);

    document.getElementById('start-button').disabled = true;
    document.getElementById('step-button').disabled = false;
    document.getElementById('reset-button').disabled = false;
    
    updateDisplay(true);
    updateGameMessage("Máquina configurada! Clique em 'Próximo Passo Mágico' para começar.", "info");
}

function executeStep() {
    if (!tmInstance) {
        updateGameMessage("Máquina não iniciada. Configure e clique em 'Começar Aventura!'", "error");
        return;
    }

    const result = tmInstance.step();
    updateDisplay(true); // Pass true to indicate it's a step that might need animation

    if (result.halted) {
        document.getElementById('step-button').disabled = true;
        if (result.finalStateReached) {
            updateGameMessage(`Aventura Concluída! Estado final ${tmInstance.currentState} alcançado em ${tmInstance.steps} passos mágicos!`, "success", true);
        } else if (result.error) {
            updateGameMessage(`Ops! Aventura interrompida! ${result.error} (Passos: ${tmInstance.steps})`, "error", true);
        } else {
            updateGameMessage(`Aventura parada por um feitiço desconhecido em ${tmInstance.steps} passos.`, "info");
        }
    }
}

function resetSimulation() {
    const tapeInput = document.getElementById('input_string').value;
    const initialState = document.getElementById('initial_state').value;
    if (tmInstance) {
        tmInstance.reset(Array.from(tapeInput), initialState);
    }
    updateDisplay();
    document.getElementById('start-button').disabled = false;
    document.getElementById('step-button').disabled = true;
    document.getElementById('reset-button').disabled = true;
    document.getElementById('steps-display').textContent = '0';
    updateGameMessage("Máquina reiniciada para um novo desafio! Configure e comece a aventura!", "info");
}

function updateDisplay(animateHead = false) {
    const tapeContainer = document.getElementById('tape-container');
    const currentStateDisplay = document.getElementById('current-state-display');
    const stepsDisplay = document.getElementById('steps-display');

    tapeContainer.innerHTML = ''; 
    let headElement = null;

    if (tmInstance) {
        const tapeToDisplay = tmInstance.tape.length > 0 ? tmInstance.tape : [tmInstance.blankSymbol];
        
        tapeToDisplay.forEach((symbol, index) => {
            const cell = document.createElement('div');
            cell.className = 'tape-cell';
            cell.textContent = symbol;
            if (index === tmInstance.head) {
                cell.classList.add('active');
                headElement = cell; // Store the head element for animation
            }
            tapeContainer.appendChild(cell);
        });

        currentStateDisplay.textContent = tmInstance.currentState;
        stepsDisplay.textContent = tmInstance.steps;

        // Scroll tape to keep head in view
        if (headElement) {
            const tapeRect = tapeContainer.getBoundingClientRect();
            const headRect = headElement.getBoundingClientRect();
            
            if (headRect.right > tapeRect.right) {
                tapeContainer.scrollLeft += headRect.right - tapeRect.right + 50; // Add some padding
            } else if (headRect.left < tapeRect.left) {
                tapeContainer.scrollLeft -= tapeRect.left - headRect.left + 50;
            }

            if(animateHead){
                headElement.classList.add('head-pulse-animation');
                setTimeout(() => {
                    headElement.classList.remove('head-pulse-animation');
                }, 500); // Duration of the pulse animation
            }
        }

    } else {
        const initialBlankSymbol = document.getElementById('blank_symbol').value || 'B';
        const cell = document.createElement('div');
        cell.className = 'tape-cell';
        cell.textContent = initialBlankSymbol;
        tapeContainer.appendChild(cell);
        currentStateDisplay.textContent = '-';
        stepsDisplay.textContent = '0';
    }
}

function updateGameMessage(message, type = "info", animate = false) {
    const messageArea = document.getElementById('game-message');
    messageArea.textContent = message;
    messageArea.className = ''; // Clear previous classes
    messageArea.classList.add(type); 

    if (animate) {
        if (type === 'success') {
            messageArea.classList.add('success-animation');
            setTimeout(() => messageArea.classList.remove('success-animation'), 1500);
        } else if (type === 'error') {
            messageArea.classList.add('error-animation');
            setTimeout(() => messageArea.classList.remove('error-animation'), 300);
        }
    }
    // General pulse for any message update
    messageArea.classList.add('message-pulse');
    setTimeout(() => messageArea.classList.remove('message-pulse'), 500);
}

