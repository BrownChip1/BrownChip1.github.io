document.addEventListener('DOMContentLoaded', function() {

    // --- Estado de la Aplicación ---
    let allMenuItems = []; // Guarda todos los items cargados del JSON
    let currentCategory = 'all'; // Categoría activa actualmente
    const menuContainer = document.getElementById('menu-container');
    const searchInput = document.getElementById('searchInput');
    const categoryTabsContainer = document.querySelector('.category-tabs');
    const tabButtons = categoryTabsContainer.querySelectorAll('.tab-button'); // Ahora se usa para cambiar estado visual

    // --- Elementos del Modal ---
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalPrice = document.getElementById('modalPrice');
    const closeModalBtn = document.querySelector('.close-modal');

    // --- Carga Inicial de Datos ---
    async function loadMenuData() {
        try {
            // Ajusta la ruta a tu archivo JSON
            const response = await fetch('data/menu.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allMenuItems = processMenuData(data); // Procesa para facilitar el acceso
            renderMenu(); // Renderiza el menú inicial ("Todos")
            setupEventListeners(); // Configura listeners DESPUÉS de cargar datos

        } catch (error) {
            console.error("Error cargando el menú:", error);
            menuContainer.innerHTML = '<div class="no-results-message">Error al cargar el menú. Por favor, inténtalo más tarde.</div>';
        } finally {
            // Ocultar indicador de carga si lo hubiera visible
            const loadingIndicator = menuContainer.querySelector('.loading-indicator');
            if (loadingIndicator) {
                // Puedes ocultarlo o eliminarlo
                // loadingIndicator.style.display = 'none';
                 menuContainer.innerHTML = ''; // Limpia el contenedor antes de renderizar
            }
        }
    }

    // --- Funcionalidad Botón Volver Arriba ---
function setupBackToTopButton() {
    const backToTopButton = document.getElementById('backToTopBtn');

    if (backToTopButton) {
        // Mostrar/Ocultar botón según el scroll
        window.addEventListener('scroll', () => {
            // Muestra el botón si se ha bajado más de (ej.) 300 píxeles
            if (window.scrollY > 150) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });

        // Scroll suave al hacer clic
        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault(); // Evita el salto brusco del href="#"
            window.scrollTo({
                top: 0,             // Ir al inicio
                behavior: 'smooth' // Animación suave
            });
        });
    }
}

     // Procesa los datos para tener una lista plana de items con su categoría
    function processMenuData(data) {
        let processedItems = [];
        data.forEach(categoryGroup => {
            categoryGroup.items.forEach(item => {
                processedItems.push({
                    ...item, // Copia todas las propiedades del item (id, title, etc.)
                    category: categoryGroup.category, // Añade la clave de la categoría
                    categoryTitle: categoryGroup.categoryTitle // Añade el título de la categoría
                });
            });
        });
        return processedItems;
    }


    // --- Renderizado del Menú ---
    function renderMenu(searchTerm = '') {
        menuContainer.innerHTML = ''; // Limpia el contenedor antes de renderizar

        let itemsToRender = [];
        const normalizedSearchTerm = searchTerm.toLowerCase().trim();

        // 1. Filtrar por categoría
        if (currentCategory === 'all') {
            itemsToRender = allMenuItems;
        } else {
            itemsToRender = allMenuItems.filter(item => item.category === currentCategory);
        }

        // 2. Filtrar por término de búsqueda (si existe)
        if (normalizedSearchTerm) {
            itemsToRender = itemsToRender.filter(item =>
                item.title.toLowerCase().includes(normalizedSearchTerm) ||
                item.description.toLowerCase().includes(normalizedSearchTerm)
            );
        }

        // 3. Renderizar o mostrar mensaje "sin resultados"
        if (itemsToRender.length === 0) {
            const message = normalizedSearchTerm
                ? `No se encontraron resultados para "${searchTerm}"` + (currentCategory !== 'all' ? ` en esta categoría.` : '.')
                : `No hay productos disponibles en esta categoría.`;
            menuContainer.innerHTML = `<div class="no-results-message">${message}</div>`;
            return;
        }

        // Agrupar items por categoría para renderizar títulos
        const itemsByCategory = itemsToRender.reduce((acc, item) => {
            const key = `${item.category}-${item.categoryTitle}`; // Clave única por subcategoría
            if (!acc[key]) {
                acc[key] = {
                    category: item.category,
                    categoryTitle: item.categoryTitle,
                    items: []
                };
            }
            acc[key].items.push(item);
            return acc;
        }, {});

        // Crear el HTML
        Object.values(itemsByCategory).forEach(categoryGroup => {
            // Crear sección (si no existe ya, importante para búsqueda en 'all')
            // Por simplicidad ahora, siempre creamos la estructura
             const sectionId = `menu-panel-${categoryGroup.category}`;
             const section = document.createElement('section');
             section.className = 'menu-section';
             section.id = sectionId; // ID para ARIA
             section.setAttribute('role', 'tabpanel');
             section.setAttribute('aria-labelledby', `tab-${categoryGroup.category}`);

             const categoryDiv = document.createElement('div');
             categoryDiv.className = 'menu-category';

             const titleH3 = document.createElement('h3');
             titleH3.className = 'menu-category-title';
             titleH3.textContent = categoryGroup.categoryTitle;
             categoryDiv.appendChild(titleH3);

             categoryGroup.items.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'menu-item';
                itemDiv.innerHTML = `
                    <div class="menu-item-content">
                        <h4 class="menu-item-title">${item.title}</h4>
                        <p class="menu-item-description">${item.description || ''}</p>
                        <span class="menu-item-price">${item.price}</span>
                    </div>
                    ${item.image ? `
                    <div class="menu-item-image-placeholder" data-item-id="${item.id}" role="button" tabindex="0" aria-label="Ampliar imagen de ${item.title}">
                        <img src="${item.image}" alt="${item.title}" loading="lazy">
                    </div>` : `
                    <div class="menu-item-image-placeholder no-image" aria-label="Imagen no disponible para ${item.title}">
                        </div>`}
                `;
                categoryDiv.appendChild(itemDiv);

                // Añadir separador (excepto después del último item de la subcategoría)
                if (index < categoryGroup.items.length - 1) {
                     const divider = document.createElement('hr');
                     divider.className = 'menu-item-divider';
                     categoryDiv.appendChild(divider);
                }
             });
             section.appendChild(categoryDiv);
             menuContainer.appendChild(section);
        });
         // Asegurarse que las secciones correctas son visibles (necesario si se busca en "all")
         updateSectionVisibility();
    }

    // Función auxiliar para mostrar/ocultar secciones (ya no usa clase .active)
     function updateSectionVisibility() {
         // Este enfoque ya no es necesario con renderMenu,
         // porque solo renderiza lo que debe ser visible.
         // Mantenemos la función vacía o la eliminamos si no se usa en otro lado.
     }


    // --- Manejadores de Eventos ---
    function setupEventListeners() {
        // Listener para Pestañas
        categoryTabsContainer.addEventListener('click', (event) => {
            const button = event.target.closest('.tab-button');
            if (!button) return; // Click fuera de un botón

            const category = button.getAttribute('data-category');
            if (category === currentCategory) return; // Ya está activa

            currentCategory = category;

            // Actualizar estado visual y ARIA de los botones
            tabButtons.forEach(btn => {
                const isSelected = btn === button;
                btn.classList.toggle('active', isSelected);
                btn.setAttribute('aria-selected', isSelected);
            });

            searchInput.value = ''; // Limpiar búsqueda al cambiar categoría
            renderMenu(); // Renderizar con la nueva categoría
        });

        setupBackToTopButton();

        // Listener para Búsqueda (con debounce opcional)
         let searchTimeout;
         searchInput.addEventListener('input', () => {
             // Debounce: Espera 300ms después de dejar de teclear
             clearTimeout(searchTimeout);
             searchTimeout = setTimeout(() => {
                  renderMenu(searchInput.value);
             }, 300);
         });

        // Listener para Abrir Modal (Usando Delegación de Eventos)
        menuContainer.addEventListener('click', (event) => {
            const imagePlaceholder = event.target.closest('.menu-item-image-placeholder');
             // Asegúrate que tenga un ID de item y no sea el placeholder vacío
            if (imagePlaceholder && imagePlaceholder.hasAttribute('data-item-id') && !imagePlaceholder.classList.contains('no-image')) {
                const itemId = imagePlaceholder.getAttribute('data-item-id');
                const itemData = allMenuItems.find(item => item.id === itemId);
                if (itemData) {
                    openImageModal(itemData);
                }
            }
        });
         // Permitir abrir modal con Enter/Space en la imagen (Accesibilidad)
         menuContainer.addEventListener('keydown', (event) => {
             const imagePlaceholder = event.target.closest('.menu-item-image-placeholder[role="button"]');
             if (imagePlaceholder && (event.key === 'Enter' || event.key === ' ')) {
                 event.preventDefault(); // Evita scroll con barra espaciadora
                 const itemId = imagePlaceholder.getAttribute('data-item-id');
                 const itemData = allMenuItems.find(item => item.id === itemId);
                 if (itemData) {
                     openImageModal(itemData);
                 }
             }
         });


        // Listeners para Cerrar Modal
        closeModalBtn.addEventListener('click', closeImageModal);
        modal.addEventListener('click', (event) => {
            // Cierra si se hace clic directamente en el fondo oscuro (el modal mismo)
            if (event.target === modal) {
                closeImageModal();
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
                closeImageModal();
            }
        });

         // Listener para Botón "Ver más/menos" en Móvil
         setupMobileToggle();

         // Actualizar año en footer (opcional)
         const yearSpan = document.getElementById('current-year');
         if(yearSpan) {
             yearSpan.textContent = new Date().getFullYear();
         }
    }

     // --- Funcionalidad del Modal ---
    function openImageModal(itemData) {
        modalImg.src = itemData.image;
        modalImg.alt = itemData.title;
        modalTitle.textContent = itemData.title;
        modalDescription.textContent = itemData.description || ''; // Maneja descripciones vacías
        modalPrice.textContent = itemData.price;

        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Evita scroll del fondo
        // Mover foco al modal para accesibilidad
        closeModalBtn.focus(); // Enfocar el botón de cerrar es una buena opción
    }

    function closeImageModal() {
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Restaura scroll del fondo
         // Devolver el foco al elemento que abrió el modal (más complejo, opcional)
         // O simplemente a un lugar lógico como el search input
         searchInput.focus();
    }

    // --- Funcionalidad Botón "Ver más/menos" en Móvil ---
    function setupMobileToggle() {
        const viewMoreBtn = document.querySelector('.view-more');
        const mobileContactInfo = document.getElementById('mobileContactInfo');

        if (viewMoreBtn && mobileContactInfo) {
            viewMoreBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const isVisible = mobileContactInfo.classList.toggle('visible');
                this.textContent = isVisible ? 'Ver menos' : 'Ver más';
                this.setAttribute('aria-expanded', isVisible);
            });

            // Reset en resize (opcional, pero bueno si el CSS no lo maneja perfectamente)
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    if (mobileContactInfo.classList.contains('visible')) {
                        mobileContactInfo.classList.remove('visible');
                        viewMoreBtn.textContent = 'Ver más';
                         viewMoreBtn.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        }
    }

    // --- Iniciar la aplicación ---
    loadMenuData();

}); // Fin del DOMContentLoaded