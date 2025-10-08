document.addEventListener('DOMContentLoaded', () => {
    const bodyId = document.body.id;

    if (bodyId === 'login-page') {
        initLoginPage();
    } else if (bodyId === 'recipes-page') {
        initRecipesPage();
    }
});


function initLoginPage() {
    if (localStorage.getItem('user')) {
        window.location.href = 'recipes.html';
        return;
    }

    const loginForm = document.getElementById('login-form');
    const messageEl = document.getElementById('message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        if (!username || !password) {
            showMessage('Username and password are required.', 'error');
            return;
        }

        showMessage('Logging in...', 'loading');

        try {
            const response = await fetch('https://dummyjson.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('user', JSON.stringify({
                id: data.id,
                username: data.username,
                firstName: data.firstName,
            }));
            
            showMessage('Login successful! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = 'recipes.html';
            }, 1000);

        } catch (error) {
            showMessage(error.message, 'error');
        }
    });

    function showMessage(msg, type) {
        messageEl.textContent = msg;
        messageEl.className = `message ${type}`;
    }
}

function initRecipesPage() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    let allRecipes = [];
    let filteredRecipes = [];
    let displayedCount = 9;
    const RECIPES_PER_PAGE = 9;

    const welcomeMessage = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-btn');
    const recipeContainer = document.getElementById('recipe-container');
    const searchInput = document.getElementById('search-input');
    const cuisineFilter = document.getElementById('cuisine-filter');
    const recipeCountEl = document.getElementById('recipe-count');
    const showMoreBtn = document.getElementById('show-more-btn');
    const modal = document.getElementById('recipe-modal');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.querySelector('.modal-close-btn');

    welcomeMessage.textContent = `Welcome, ${user.firstName}!`;
    fetchRecipes();

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
    
    searchInput.addEventListener('input', debounce(handleFilterChange, 300));
    cuisineFilter.addEventListener('change', handleFilterChange);
    showMoreBtn.addEventListener('click', showMoreRecipes);
    modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    async function fetchRecipes() {
        try {
            const response = await fetch('https://dummyjson.com/recipes?limit=0');
            if (!response.ok) throw new Error('Failed to fetch recipes.');
            const data = await response.json();
            allRecipes = data.recipes;
            filteredRecipes = [...allRecipes];
            populateCuisineFilter();
            renderRecipes();
        } catch (error) {
            recipeContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
    }

    function populateCuisineFilter() {
        const cuisines = [...new Set(allRecipes.map(r => r.cuisine))];
        cuisines.sort().forEach(cuisine => {
            const option = document.createElement('option');
            option.value = cuisine;
            option.textContent = cuisine;
            cuisineFilter.appendChild(option);
        });
    }
    
    function renderRecipes() {
        recipeContainer.innerHTML = ''; 
        const recipesToRender = filteredRecipes.slice(0, displayedCount);

        if (recipesToRender.length === 0) {
            recipeContainer.innerHTML = '<p>No recipes found.</p>';
        }

        recipesToRender.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.name}">
                <div class="recipe-card-content">
                    <h3>${recipe.name}</h3>
                    <div class="recipe-card-details">
                        <span>${recipe.cookTimeMinutes} mins</span>
                        <span>${recipe.difficulty}</span>
                        <span>${recipe.cuisine}</span>
                    </div>
                    <p><strong>Ingredients:</strong> ${recipe.ingredients.slice(0, 5).join(', ')}...</p>
                    <div class="recipe-card-rating">Rating: ${'★'.repeat(Math.round(recipe.rating))}${'☆'.repeat(5 - Math.round(recipe.rating))} (${recipe.rating})</div>
                    <button class="btn view-recipe-btn" data-id="${recipe.id}">View Full Recipe</button>
                </div>
            `;
            recipeContainer.appendChild(card);
        });

        document.querySelectorAll('.view-recipe-btn').forEach(button => {
            button.addEventListener('click', () => showRecipeDetails(button.dataset.id));
        });

        updateRecipeCount();
        updateShowMoreButton();
    }

    function handleFilterChange() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCuisine = cuisineFilter.value;

        filteredRecipes = allRecipes.filter(recipe => {
            const matchesCuisine = !selectedCuisine || recipe.cuisine === selectedCuisine;
            const matchesSearch = !searchTerm || 
                recipe.name.toLowerCase().includes(searchTerm) ||
                recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm)) ||
                recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            return matchesCuisine && matchesSearch;
        });
        
        displayedCount = RECIPES_PER_PAGE; 
        renderRecipes();
    }

    function updateRecipeCount() {
        recipeCountEl.textContent = `Showing ${Math.min(displayedCount, filteredRecipes.length)} of ${filteredRecipes.length} recipes.`;
    }

    function updateShowMoreButton() {
        if (displayedCount >= filteredRecipes.length) {
            showMoreBtn.classList.add('hidden');
        } else {
            showMoreBtn.classList.remove('hidden');
        }
    }
    
    function showMoreRecipes() {
        displayedCount += RECIPES_PER_PAGE;
        renderRecipes();
    }

    function showRecipeDetails(recipeId) {
        const recipe = allRecipes.find(r => r.id == recipeId);
        if (!recipe) return;

        modalBody.innerHTML = `
            <h2>${recipe.name}</h2>
            <img src="${recipe.image}" alt="${recipe.name}">
            <div class="modal-details-grid">
                <div class="detail-item"><span>Prep Time</span><strong>${recipe.prepTimeMinutes} mins</strong></div>
                <div class="detail-item"><span>Cook Time</span><strong>${recipe.cookTimeMinutes} mins</strong></div>
                <div class="detail-item"><span>Servings</span><strong>${recipe.servings}</strong></div>
                <div class="detail-item"><span>Difficulty</span><strong>${recipe.difficulty}</strong></div>
                <div class="detail-item"><span>Cuisine</span><strong>${recipe.cuisine}</strong></div>
                <div class="detail-item"><span>Calories</span><strong>${recipe.caloriesPerServing}</strong></div>
            </div>
            <h3>Ingredients</h3>
            <ul>
                ${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}
            </ul>
            <h3>Instructions</h3>
            <ol>
                ${recipe.instructions.map(i => `<li>${i}</li>`).join('')}
            </ol>
        `;
        modal.classList.remove('hidden');
    }

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
}