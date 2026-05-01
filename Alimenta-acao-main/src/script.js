let alimentos = [];
let lancheira = [];
const LIMITE_KCAL = 400;
let categoriaAtual = 'Todos'; 


const icones = {
    'Frutas': 'fa-apple-alt',
    'Vegetais': 'fa-carrot',
    'Laticínios': 'fa-cheese',
    'Oleaginosas': 'fa-seedling',
    'Carboidratos': 'fa-bread-slice',
    'Proteínas': 'fa-egg',
    'Todos': 'fa-list-ul'
};



fetch('/api/alimentos')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alimentos = data;
        preencherCategorias();
        
        
        
    })
    .catch(error => {
        console.error('ERRO FATAL: Não foi possível carregar a base de alimentos.', error);
        const msg = document.getElementById("mensagem");
        msg.textContent = "❌ Erro ao carregar dados. Verifique a localização do 'alimentos.json'.";
        msg.className = "mensagem perigo";
    });


function iniciarMontagem() {
    const landingSection = document.getElementById('landing-section');
    const mainContent = document.getElementById('main-content');
    const cabecalhoH1 = document.querySelector('.cabecalho h1');
    const logotipo = document.querySelector('.logotipo');

    
    cabecalhoH1.style.fontSize = '2rem';
    logotipo.style.width = '120px';

    
    
    landingSection.style.opacity = '0';
    landingSection.style.maxHeight = '0';
    landingSection.style.marginBottom = '0';
    landingSection.style.padding = '0';
    landingSection.style.overflow = 'hidden';


    
    setTimeout(() => {
        
        mainContent.classList.remove('hidden'); 
        
        mainContent.classList.add('full-width'); 

        
        window.scrollTo({
            top: mainContent.offsetTop - 50, 
            behavior: 'smooth'
        });
        
        
        setTimeout(() => {
             landingSection.style.display = 'none';
             preencherListaAlimentos(categoriaAtual); 
             atualizarLancheira(); 
        }, 500); 
       

    }, 100); 
}




function preencherCategorias() {
    const container = document.getElementById("categorias-container");
    container.innerHTML = "";

    const categoriasUnicas = ['Todos', ...new Set(alimentos.map(item => item.categoria))];

    categoriasUnicas.forEach(categoria => {
        const button = document.createElement("button");
        button.className = 'btn-categoria';
        button.textContent = categoria;
        
        const icon = document.createElement("i");
        icon.className = `fas ${icones[categoria] || 'fa-utensils'}`;
        button.prepend(icon);

        button.onclick = () => {
            filtrarPorCategoria(categoria);
        };
        
        container.appendChild(button);
    });

    
    filtrarPorCategoria('Todos');
}

function filtrarPorCategoria(categoria) {
    categoriaAtual = categoria;
    
    document.querySelectorAll('.btn-categoria').forEach(btn => {
        if (btn.textContent.trim() === categoria) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    preencherListaAlimentos(categoria);
}

function preencherListaAlimentos(categoria) {
    const listaAlimentosDiv = document.getElementById("alimentos-lista");
    listaAlimentosDiv.innerHTML = "";

    let alimentosFiltrados = alimentos;
    if (categoria !== 'Todos') {
        alimentosFiltrados = alimentos.filter(item => item.categoria === categoria);
    }

    if (alimentosFiltrados.length === 0) {
        listaAlimentosDiv.innerHTML = '<p style="text-align: center; color: #777;">Nenhum alimento nesta categoria.</p>';
        return;
    }

    alimentosFiltrados.forEach((alimento) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = 'item-alimento';

        const indexOriginal = alimentos.findIndex(a => a.nome === alimento.nome && a.kcal === alimento.kcal);
        
        itemDiv.innerHTML = `
            <span>${alimento.nome}</span>
            <span class="kcal">${alimento.kcal} kcal</span>
        `;
        
        itemDiv.onclick = () => adicionarAlimento(indexOriginal);
        
        listaAlimentosDiv.appendChild(itemDiv);
    });
}

function adicionarAlimento(index) {
    if (index === undefined || index === -1) return;
    
    lancheira.push({...alimentos[index]});
    atualizarLancheira();
}

function limparLancheira() {
    if (confirm("Tem certeza que deseja limpar toda a sua lancheira?")) {
        lancheira = [];
        atualizarLancheira();
    }
}

function removerAlimento(index) {
    lancheira.splice(index, 1);
    atualizarLancheira();
}



function atualizarLancheira() {
    const lista = document.getElementById("lancheira");
    const totalElement = document.getElementById("total");
    const mensagemElement = document.getElementById("mensagem");

    lista.innerHTML = "";
    let totalKcal = 0;
    const temUltraprocessado = lancheira.some(item =>
    item.categoria === 'Proteínas e Gorduras Ultraprocessadas'
);
    

    if (lancheira.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #b1b1b1; margin-top: 20px;">Sua lancheira está vazia. Adicione itens!</p>';
        totalElement.textContent = `Total de Calorias: 0 kcal`;
        mensagemElement.textContent = "Monte sua lancheira para começar!";
        mensagemElement.className = "mensagem";
        totalElement.style.color = '#b1b1b1'; 
        return;
    } 

    lancheira.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="item-detalhes">
                <span class="item-nome">${item.nome}</span>
                <span class="item-kcal">${item.kcal} kcal</span>
            </div>
            <button class="remover-item-btn" onclick="removerAlimento(${index})">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        lista.appendChild(li);
        totalKcal += item.kcal;
    });

    totalElement.textContent = `Total de Calorias: ${totalKcal} kcal`;

    if (totalKcal > LIMITE_KCAL) {
        mensagemElement.textContent = `⚠️ Você ultrapassou o limite de ${LIMITE_KCAL} kcal por ${totalKcal - LIMITE_KCAL} kcal! Revise suas escolhas.`;
        mensagemElement.className = "mensagem perigo";
        totalElement.style.color = '#ef4444'; 

    if (temUltraprocessado) {
    mensagemElement.textContent += " ⚠️ Contém alimentos ultraprocessados. Prefira opções naturais.";
}
    } else if (totalKcal > LIMITE_KCAL * 0.75 && totalKcal <= LIMITE_KCAL) {
        mensagemElement.textContent = `✅ Você está no alvo de calorias.`;
        mensagemElement.className = "mensagem sucesso";
        totalElement.style.color = '#4ade80';

    if (temUltraprocessado) {
    mensagemElement.textContent += " ⚠️ Contém alimentos ultraprocessados. Prefira opções naturais.";
}
    } else {
        mensagemElement.textContent = `👍 Continue adicionando! Você está com ${totalKcal} kcal.`;
        mensagemElement.className = "mensagem alerta";
        totalElement.style.color = '#fde047';
        
    if (temUltraprocessado) {
    mensagemElement.textContent += " ⚠️ Contém alimentos ultraprocessados. Prefira opções naturais.";
}
    }
}

window.iniciarMontagem = iniciarMontagem;
window.removerAlimento = removerAlimento;
window.limparLancheira = limparLancheira;
