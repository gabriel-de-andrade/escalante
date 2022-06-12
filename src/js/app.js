const Toast = {
    toastContainer: document.querySelector('#toast-container'),

    criar(mensagem, tipo = '', delay = 5000) {
        const TIPOS = ['primary', 'success', 'warning', 'danger'];

        const toastId = `toast-${Date.now()}`;

        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center ${TIPOS.includes(tipo) ? `text-bg-${tipo}` : ''} border-0 mb-3" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${delay}">
                <div class="d-flex">
                    <div class="toast-body">
                        ${mensagem}
                    </div>
                    <button type="button" class="btn-close ${TIPOS.includes(tipo) && tipo !== 'warning' ? 'btn-close-white' : ''} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        this.toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        const toast = document.querySelector(`#${toastId}`);

        toast.addEventListener('hidden.bs.toast', event => {
            event.currentTarget.remove();
        });

        new bootstrap.Toast(toast).show();
    },
};

const Util = {
    forcarDoisDigitos(numero) {
        return numero.toString().padStart(2, '0');
    },

    calcularMinutosEntreDatas(dataInicial, dataFinal) {
        const UM_MINUTO_EM_MILISSEGUNDOS = 60000;

        const diferencaEmMilissegundos = dataFinal.getTime() - dataInicial.getTime();
        return Math.floor(diferencaEmMilissegundos / UM_MINUTO_EM_MILISSEGUNDOS);
    },

    converterMinutosEmHoras(minutos, verboso = false) {
        const UMA_HORA_EM_MINUTOS = 60;

        const horasConvertidas = this.forcarDoisDigitos(Math.floor(minutos / UMA_HORA_EM_MINUTOS));
        const minutosConvertidos = this.forcarDoisDigitos(minutos % UMA_HORA_EM_MINUTOS);

        return verboso
            ? `${horasConvertidas} horas e ${minutosConvertidos} minutos`
            : `${horasConvertidas}:${minutosConvertidos}`;
    },

    obterHoraDeData(data) {
        const horas = this.forcarDoisDigitos(data.getHours());
        const minutos = this.forcarDoisDigitos(data.getMinutes());
        return `${horas}:${minutos}`;
    },

    copiarTextoParaClipboard(texto) {
        const LOCALHOSTS = ['127.0.0.1', 'localhost', ''];

        if (location.protocol === 'https:' || LOCALHOSTS.includes(location.hostname)) {
            navigator.clipboard.writeText(texto);
            return true;
        }

        return false;
    },
};

const Formulario = {
    qtdPlantonistas: document.querySelector('#qtd-plantonistas'),
    horaInicial: document.querySelector('#hora-inicial'),
    minutoInicial: document.querySelector('#minuto-inicial'),
    horaFinal: document.querySelector('#hora-final'),
    minutoFinal: document.querySelector('#minuto-final'),

    obterValores() {
        return {
            qtdPlantonistas: this.qtdPlantonistas.value.trim(),
            horaInicial: this.horaInicial.value.trim(),
            minutoInicial: this.minutoInicial.value.trim(),
            horaFinal: this.horaFinal.value.trim(),
            minutoFinal: this.minutoFinal.value.trim(),
        };
    },

    obterDatas() {
        const { horaInicial, minutoInicial, horaFinal, minutoFinal } = this.obterValores();

        const hoje = new Date();
        const dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), horaInicial, minutoInicial);
        const dataFinal = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), horaFinal, minutoFinal);

        if (dataInicial.getTime() >= dataFinal.getTime()) {
            dataFinal.setDate(dataFinal.getDate() + 1);
        }

        return { dataInicial, dataFinal };
    },

    validarCampos() {
        const { qtdPlantonistas, horaInicial, minutoInicial, horaFinal, minutoFinal } = this.obterValores();

        if (
            qtdPlantonistas === '' ||
            horaInicial === '' ||
            minutoInicial === '' ||
            horaFinal === '' ||
            minutoFinal === ''
        ) {
            throw new Error('Por favor, preencha todos os campos.');
        }

        if (
            qtdPlantonistas < 1 ||
            qtdPlantonistas > 20
        ) {
            throw new Error('A quantidade de plantonistas não é válida. Insira um número entre 1 e 20.');
        }

        if (
            horaInicial < 0 ||
            horaInicial > 23 ||
            minutoInicial < 0 ||
            minutoInicial > 59
        ) {
            throw new Error('A hora inicial não é válida.');
        }

        if (
            horaFinal < 0 ||
            horaFinal > 23 ||
            minutoFinal < 0 ||
            minutoFinal > 59
        ) {
            throw new Error('A hora final não é válida.');
        }
    },

    processar(event) {
        event.preventDefault();

        const { dataInicial, dataFinal } = this.obterDatas();
        const { qtdPlantonistas } = this.obterValores();

        try {
            this.validarCampos();

            const escala = Escalante.gerarEscala(dataInicial, dataFinal, qtdPlantonistas);

            DOM.imprimirEscala(escala);

            if (Util.copiarTextoParaClipboard(DOM.conteudoEscala.innerText)) {
                Toast.criar('O resultado foi copiado para o clipboard.<br>Pronto para colar!', 'primary');
            }

            document.activeElement.blur();
        } catch (error) {
            Toast.criar(error.message, 'danger');
        }
    },

    resetar() {
        DOM.ocultarSecaoResultado();
        this.qtdPlantonistas.focus();
    },
};

const Escalante = {
    calcularMinutos(dataInicial, dataFinal, qtdPlantonistas) {
        const minutosTotal = Util.calcularMinutosEntreDatas(dataInicial, dataFinal);
        const minutosFracao = Math.floor(minutosTotal / qtdPlantonistas);
        const minutosResto = minutosTotal % qtdPlantonistas;

        return { minutosTotal, minutosFracao, minutosResto };
    },

    gerarEscala(dataInicial, dataFinal, qtdPlantonistas) {
        const {
            minutosTotal,
            minutosFracao,
            minutosResto
        } = this.calcularMinutos(dataInicial, dataFinal, qtdPlantonistas);

        const escala = {
            minutosTotal,
            minutosFracao,
            minutosResto,
            horarios: [],
        };

        for (let indice = 0; indice < qtdPlantonistas; indice++) {
            const dataHoraEntrada = new Date(dataInicial);
            const dataHoraSaida = indice === qtdPlantonistas - 1
                ? new Date(dataInicial.setMinutes(dataInicial.getMinutes() + minutosFracao + minutosResto))
                : new Date(dataInicial.setMinutes(dataInicial.getMinutes() + minutosFracao));

            escala.horarios.push({
                horaEntrada: Util.obterHoraDeData(dataHoraEntrada),
                horaSaida: Util.obterHoraDeData(dataHoraSaida),
            });
        }

        return escala;
    },
};

const DOM = {
    secaoResultado: document.querySelector('#secao-resultado'),
    conteudoEscala: document.querySelector('#conteudo-escala'),
    anoAtual: document.querySelector('#ano-atual'),

    inserirAnoAtual() {
        this.anoAtual.innerHTML = new Date().getFullYear();
    },

    gerarConteudoEscala({ minutosTotal, minutosFracao, minutosResto, horarios }) {
        const tempoTotal = Util.converterMinutosEmHoras(minutosTotal, true);
        const tempoIndividual = Util.converterMinutosEmHoras(minutosFracao, true);

        const escalaHTML = `
            <p class="card-text">
                <strong>${tempoIndividual}</strong> para cada plantonista
                <span class="ms-1"></span>
                <small class="tag d-inline-flex px-2 py-1 fw-semibold text-${minutosResto > 0 ? 'danger': 'success'} bg-${minutosResto > 0 ? 'danger': 'success'} bg-opacity-10 border border-${minutosResto > 0 ? 'danger': 'success'} border-opacity-10 rounded-2">
                    + ${Util.forcarDoisDigitos(minutosResto)} min
                </small>
            </p>

            <p class="card-text">
                ${horarios.map((horario, indice) =>
                    `<strong>${Util.forcarDoisDigitos(indice + 1)}</strong>. ${horario.horaEntrada} - ${horario.horaSaida}`
                ).join('<br>')}
            </p>

            <p class="card-text">
                Escala de ${tempoTotal} gerada pelo Escalante!
            </p>
        `;

        return escalaHTML;
    },

    imprimirEscala(escala) {
        if (escala.minutosResto > 0) {
            Toast.criar(`Restaram ${escala.minutosResto} minutos da divisão e foram adicionados ao último horário.`, 'warning');
        }

        this.conteudoEscala.innerHTML = this.gerarConteudoEscala(escala);
        this.exibirSecaoResultado();
    },

    exibirSecaoResultado() {
        this.secaoResultado.classList.remove('d-none');
    },

    ocultarSecaoResultado() {
        this.secaoResultado.classList.add('d-none');
        this.conteudoEscala.innerHTML = '';
    },
};

DOM.inserirAnoAtual();
