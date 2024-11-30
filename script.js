document.addEventListener('DOMContentLoaded', async () => {
    const userContainer = document.getElementById('user-container');

    // Preuzimanje korisnika sa API-ja
    async function fetchUsers() {
        try {
            const response = await fetch(
                'https://rezotest-dkg4dsdze2c3e7c5.italynorth-01.azurewebsites.net/api/User/all'
            );
            if (!response.ok) {
                throw new Error('Greška prilikom povlačenja korisnika.');
            }
            return await response.json();
        } catch (error) {
            console.error('Greška:', error);
            return [];
        }
    }

    // API poziv za izmenu statusa
    async function toggleSubscriptionStatus(userId) {
        try {
            const response = await fetch(
                'https://rezotest-dkg4dsdze2c3e7c5.italynorth-01.azurewebsites.net/api/User/toggle-subscription',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        accept: '*/*',
                    },
                    body: JSON.stringify({ id: userId }),
                }
            );

            if (!response.ok) {
                throw new Error('Greška prilikom izmene statusa.');
            }

            const updatedUser = await response.json();
            return updatedUser;
        } catch (error) {
            console.error('Greška:', error);
            return null;
        }
    }

    // API poziv za plaćanje
    async function processPayment(userId, monthsPaid) {
        try {
            const response = await fetch(
                'https://rezotest-dkg4dsdze2c3e7c5.italynorth-01.azurewebsites.net/api/User/payment',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        accept: '*/*',
                    },
                    body: JSON.stringify({ id: userId, monthsPaid }),
                }
            );

            if (!response.ok) {
                throw new Error('Greška prilikom plaćanja.');
            }

            const updatedUser = await response.json();
            return updatedUser;
        } catch (error) {
            console.error('Greška:', error);
            return null;
        }
    }

    function createStatusButton(subscriptionStatus, nextPaymentDate) {
        const button = document.createElement('button');
        button.classList.add('status-btn');
    
        const today = new Date();
        const nextPayment = new Date(nextPaymentDate);
        const oneWeekLater = new Date(today);
        oneWeekLater.setDate(today.getDate() + 7);
    
        if (!subscriptionStatus) {
            button.textContent = 'NEAKTIVAN';
            button.classList.add('status-neaktivno');
        } else if (nextPayment < today) {
            button.textContent = 'PLAĆANJE';
            button.classList.add('status-placanje-crveno');
        } else if (nextPayment <= oneWeekLater) {
            button.textContent = 'PLAĆANJE';
            button.classList.add('status-placanje-zuto');
        } else {
            button.textContent = 'AKTIVAN';
            button.classList.add('status-aktivno');
        }
    
        return button;
    }


    document.getElementById('searchButton').addEventListener('click', () => {
        const searchTerm = document.getElementById('searchInput').value.trim();
        renderUsers(searchTerm); // Filtriraj korisnike prema unetom pojmu
    });
    
    

    // Prikaz popup-a za plaćanje
    function showPaymentPopup(userId) {
        const popup = document.createElement('div');
        popup.classList.add('popup');

        popup.innerHTML = `
            <div class="popup-content">
                <h2>Unesite broj meseci za uplatu</h2>
                <input type="number" id="monthsPaid" placeholder="Broj meseci" min="1">
                <div class="popup-buttons">
                    <button id="confirmPayment">Potvrdi</button>
                    <button id="cancelPayment">Otkaži</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        const confirmButton = document.getElementById('confirmPayment');
        const cancelButton = document.getElementById('cancelPayment');

        // Procesiranje plaćanja
        confirmButton.addEventListener('click', async () => {
            const monthsPaid = document.getElementById('monthsPaid').value;
            if (!monthsPaid || monthsPaid <= 0) {
                alert('Unesite validan broj meseci.');
                return;
            }

            const updatedUser = await processPayment(userId, parseInt(monthsPaid));
            if (updatedUser) {
                alert('Plaćanje uspešno.');
                renderUsers(); // Osveži prikaz korisnika
                popup.remove();
            } else {
                alert('Greška prilikom plaćanja.');
            }
        });

        // Zatvaranje popup-a
        cancelButton.addEventListener('click', () => {
            popup.remove();
        });
    }

    async function renderUsers(searchTerm = '') {
        const users = await fetchUsers();
    
        if (!users.length) {
            userContainer.innerHTML = '<p>Nema korisnika za prikaz.</p>';
            return;
        }
    
        userContainer.innerHTML = ''; // Očistiti sadržaj pre dodavanja novih korisnika
    
        // Normalizuj unos za pretragu
        const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    
        // Filtriraj korisnike prema kriterijumu
        const filteredUsers = users.filter((user) => {
            const emailMatch = user.email.toLowerCase().includes(normalizedSearchTerm);
            const restaurantNameMatch = user.restaurant?.name?.toLowerCase().includes(normalizedSearchTerm) || false;
            const statusMatch =
                (normalizedSearchTerm === 'true' && user.subscriptionStatus === true) ||
                (normalizedSearchTerm === 'false' && user.subscriptionStatus === false);
    
            return emailMatch || restaurantNameMatch || statusMatch;
        });
    
        if (!filteredUsers.length) {
            userContainer.innerHTML = '<p>Nema korisnika koji odgovaraju pretrazi.</p>';
            return;
        }
    
        filteredUsers.forEach((user) => {
            const card = document.createElement('div');
            card.classList.add('card');
    
            card.innerHTML = `
                <h2>${user.email}</h2>
                <p>Poslednja uplata: ${new Date(user.lastPayment).toLocaleDateString()}</p>
                <p>Sledeća uplata: ${new Date(user.nextPayment).toLocaleDateString()}</p>
            `;
    
            // Kreiranje status dugmeta
            const statusButton = createStatusButton(user.subscriptionStatus, user.nextPayment);
            card.appendChild(statusButton);
    
            // Dugme za izmenu statusa
            const toggleButton = document.createElement('button');
            toggleButton.textContent = 'IZMENI STATUS';
            toggleButton.classList.add('toggle-btn');
    
            toggleButton.addEventListener('click', async () => {
                const updatedUser = await toggleSubscriptionStatus(user.id);
                if (updatedUser) {
                    renderUsers(searchTerm); // Osveži prikaz sa pretragom
                } else {
                    alert('Greška prilikom izmene statusa.');
                }
            });
    
            // Dugme za plaćanje
            const paymentButton = document.createElement('button');
            paymentButton.textContent = 'PLAĆANJE';
            paymentButton.classList.add('payment-btn');
    
            paymentButton.addEventListener('click', () => {
                showPaymentPopup(user.id);
            });
    
            card.appendChild(toggleButton);
            card.appendChild(paymentButton);
    
            userContainer.appendChild(card);
        });
    }

    renderUsers();
});
