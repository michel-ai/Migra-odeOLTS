document.addEventListener('DOMContentLoaded', function () {
    // Função que será chamada quando o formulário for enviado
    document.querySelector('#ordemServico').addEventListener('submit', enviarTextos);

    function enviarTextos(event) {
        // Evitar o comportamento padrão do formulário (recarregar a página)
        event.preventDefault();

        // Pegando os valores do formulário
        const ramo = document.querySelector('#ramo').value;
        const vlan = document.querySelector('#vlan').value;
        const placa = document.querySelector('#placa').value;
        const json = document.querySelector('#json').value;

        // Limpar resultados antes de adicionar novos
        const resultados = document.querySelector('#resultados');
        resultados.innerHTML = '';

        // Tentar fazer o parse do JSON
        let parsedData;
        try {
            parsedData = JSON.parse(json);

        } catch (error) {
            alert('Erro ao processar o JSON. Certifique-se de que o formato está correto.');
            console.error('Erro ao processar JSON:', error);
            return;
        }

        // Processar cada item do JSON
        parsedData.forEach(item => {
            const nome = item.name;
            const serial = item["serial-number"];
            const lineProfile = item["line-profile"];

            // Criar lista de comandos com base no profile de linha
            let comandos = [];

            // Verificar se lineProfile contém 'BRIDGE' ou valores relacionados ao modo ROUTER
            if (lineProfile && lineProfile.toUpperCase().includes('BRIDGE')) {
                comandos = [
                    `conf`,
                    `interface gpon ${placa}`,
                    `ont add ${ramo} sn-auth ${serial} omci ont-lineprofile-id 2440 ont-srvprofile-id 2440 desc "${nome}"`,
                    `ont port native-vlan ${ramo} eth 1 vlan ${vlan} priority 0`,
                    `ont tr069-server-config ${ramo} profile-id 30`,
                    `quit`,
                    `service-port vlan 111 gpon ${placa}/${ramo} ont gemport 126 multi-service user-vlan 111 tag-transform translate`,
                    `service-port vlan ${vlan} gpon ${placa}/${ramo} ont gemport 126 multi-service user-vlan ${vlan} tag-transform translate`
                ];
            } else if (lineProfile && (lineProfile.toUpperCase().includes('ROUTER') ||
                lineProfile.toUpperCase().includes('HUAWEI') ||
                lineProfile.toUpperCase().includes('TEMP') ||
                lineProfile.toUpperCase().includes('TEMP-ROUTER'))) {
                comandos = [
                    `conf`,
                    `interface gpon ${placa}`,
                    `ont add ${ramo} sn-auth ${serial} omci ont-lineprofile-id 2440 ont-srvprofile-id 2440 desc "${nome}"`,
                    `ont ipconfig ${ramo} ip-index 1 dhcp vlan 111 priority 5`,
                    `ont tr069-server-config ${ramo} profile-id 30`,
                    `quit`,
                    `service-port vlan ${vlan} gpon ${placa}/${ramo} ont gemport 126 multi-service user-vlan ${vlan} tag-transform translate`,
                    `service-port vlan 111 gpon ${placa}/${ramo} ont gemport 126 multi-service user-vlan 111 tag-transform translate`
                ];
            }

            // Exibir os comandos no campo de resultados
            comandos.forEach(comando => {
                const li = document.createElement('li');
                li.textContent = comando; // Define o texto do comando
                resultados.appendChild(li); // Adiciona o comando à lista
            });
        });
    }
});

function limparCampos() {
    const campos = ['placa', 'ramo', 'vlan', 'json'];
    campos.forEach(id => {
        this.formulario.querySelector(`#${id}`).value = '';
    });
}

// Função para copiar os dados
function copiarParaAreaDeTransferencia() {
    // Seleciona todos os itens da lista de resultados
    const listaTexto = Array.from(document.querySelectorAll("#resultados li"))
        .map(item => item.textContent)
        .join("\n");

    // Verifica se há conteúdo para copiar
    if (listaTexto.trim() === '') {
        alert("Nenhum dado disponível para copiar.");
        return;
    }

    // Cria um elemento textarea temporário para copiar o conteúdo
    const textarea = document.createElement("textarea");
    textarea.value = listaTexto;
    document.body.appendChild(textarea);

    // Seleciona e copia o conteúdo do textarea
    textarea.select();
    document.execCommand("copy");

    // Remove o textarea temporário
    document.body.removeChild(textarea);

    alert("Lista copiada para a área de transferência!");
}

// Adiciona o evento de clique ao botão "Copiar os Dados"
document.getElementById('btn-copiar').addEventListener('click', copiarParaAreaDeTransferencia);

// Alterna o modo escuro
document.getElementById('toggleDarkMode').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    document.querySelectorAll('.container, .label, .box, .descricao, .geo, .button')
        .forEach(element => element.classList.toggle('dark-mode'));

    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
});
