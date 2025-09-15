        let englishData = {};
        let existingTranslationData = {};
        let translations = {};
        let originalLocale = 'en';
        let targetLocale = '';
        let currentFilter = 'all';

        document.getElementById('englishFile').addEventListener('change', handleEnglishFileUpload);
        document.getElementById('translationFile').addEventListener('change', handleTranslationFileUpload);
        document.getElementById('targetLanguage').addEventListener('input', updateTargetLanguage);

        // Filter button functionality
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                applyFilter();
            });
        });

        function toggleNewItemsFilterBtn() {
            const btn = document.getElementById('newItemsFilterBtn');
            const englishLoaded = Object.keys(englishData).length > 0;
            const translationLoaded = Object.keys(existingTranslationData).length > 0;
            btn.style.display = (englishLoaded && translationLoaded) ? '' : 'none';
        }

        function handleEnglishFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            console.log('English file selected:', file.name);

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    englishData = JSON.parse(e.target.result);
                    originalLocale = englishData['@@locale'] || 'en';
                    
                    document.getElementById('englishFileName').textContent = file.name;
                    document.getElementById('englishStatus').classList.add('loaded');
                    document.getElementById('englishStatus').classList.remove('not-loaded');
                    document.getElementById('originalLocale').textContent = originalLocale;
                    
                    updateFileInfo();
                    
                    if (Object.keys(englishData).length > 0) {
                        processData();
                    }
                } catch (error) {
                    console.error('Error parsing English file:', error);
                    alert('Error parsing English file. Please make sure it\'s a valid JSON file.');
                }
            };
            
            reader.onerror = function(error) {
                console.error('Error reading English file:', error);
                alert('Error reading English file. Please try again.');
            };
            
            reader.readAsText(file);
        }

        function handleTranslationFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            console.log('Translation file selected:', file.name);

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    existingTranslationData = JSON.parse(e.target.result);
                    targetLocale = existingTranslationData['@@locale'] || '';
                    
                    document.getElementById('translationFileName').textContent = file.name;
                    document.getElementById('translationStatus').classList.add('loaded');
                    document.getElementById('translationStatus').classList.remove('not-loaded');
                    document.getElementById('targetLocaleDisplay').textContent = targetLocale || 'Not specified';
                    
                    if (targetLocale) {
                        document.getElementById('targetLanguage').value = targetLocale;
                    }
                    
                    updateFileInfo();
                    
                    if (Object.keys(englishData).length > 0) {
                        processData();
                    }
                } catch (error) {
                    console.error('Error parsing translation file:', error);
                    alert('Error parsing translation file. Please make sure it\'s a valid JSON file.');
                }
            };
            
            reader.onerror = function(error) {
                console.error('Error reading translation file:', error);
                alert('Error reading translation file. Please try again.');
            };
            
            reader.readAsText(file);
        }

        function updateFileInfo() {
            document.getElementById('fileInfo').classList.add('show');
        }

        function processData() {
            if (Object.keys(englishData).length === 0) return;

            console.log('Processing data...');
            
            const translatableItems = {};
            
            for (const [key, value] of Object.entries(englishData)) {
                if (!key.startsWith('@') && key !== '@@locale' && typeof value === 'string') {
                    translatableItems[key] = {
                        text: value,
                        description: englishData[`@${key}`]?.description || '',
                        placeholders: englishData[`@${key}`]?.placeholders || {},
                        isNew: !existingTranslationData.hasOwnProperty(key),
                        existingTranslation: existingTranslationData[key] || ''
                    };
                }
            }

            // Pre-fill translations from existing file
            translations = {};
            let preFilledCount = 0;
            
            for (const [key, item] of Object.entries(translatableItems)) {
                if (item.existingTranslation) {
                    translations[key] = item.existingTranslation;
                    preFilledCount++;
                }
            }

            console.log('Translatable items:', translatableItems);
            console.log('Pre-filled translations:', preFilledCount);

            document.getElementById('itemCount').textContent = Object.keys(translatableItems).length;
            document.getElementById('preFilledCount').textContent = preFilledCount;

            renderTranslationItems(translatableItems);
            updateStats();
            
            document.getElementById('languageSection').classList.remove('hidden');
            document.getElementById('exportSection').classList.remove('hidden');
            toggleNewItemsFilterBtn();
        }

        function renderTranslationItems(items) {
            const container = document.getElementById('translationContainer');
            container.innerHTML = '';

            for (const [key, item] of Object.entries(items)) {
                const itemDiv = document.createElement('div');
                itemDiv.className = `translation-item ${item.isNew ? 'new' : 'existing'}`;
                itemDiv.dataset.key = key;
                itemDiv.dataset.type = item.isNew ? 'new' : 'existing';

                const placeholders = extractPlaceholders(item.text);
                const placeholderInfo = placeholders.length > 0 ? 
                    `<div class="placeholder-info">
                        <strong>Required placeholders:</strong> ${placeholders.join(', ')}
                    </div>` : '';

                const showNewBadge = Object.keys(existingTranslationData).length > 0;
                const statusBadges = `
                    <div class="status-badges">
                        <div class="status-badge ${item.existingTranslation ? 'completed' : 'pending'}">${item.existingTranslation ? 'Completed' : 'Pending'}</div>
                        ${showNewBadge ? `<div class="status-badge ${item.isNew ? 'new' : 'existing'}">${item.isNew ? 'New' : 'Existing'}</div>` : ''}
                    </div>
                `;

                itemDiv.innerHTML = `
                    <div class="item-header">
                        <div class="key-name">${key}</div>
                        ${statusBadges}
                    </div>
                    <div class="original-text">
                        <div class="original-label">Original (${originalLocale})</div>
                        <div>${item.text}</div>
                    </div>
                    <textarea class="translation-input" 
                              placeholder="Enter translation..." 
                              data-key="${key}"
                              oninput="handleTranslationInput(this)">${item.existingTranslation}</textarea>
                    ${placeholderInfo}
                    ${item.description ? `<div class="description">Description: ${item.description}</div>` : ''}
                    <div class="error-message hidden"></div>
                `;

                container.appendChild(itemDiv);

                if (item.existingTranslation) {
                    updateItemStatus(itemDiv, item.existingTranslation, key);
                }
            }
            
            console.log('Rendered', Object.keys(items).length, 'translation items');
            applyFilter();
        }

        function extractPlaceholders(text) {
            const matches = text.match(/\{[^}]+\}/g);
            return matches || [];
        }

        function handleTranslationInput(input) {
            const key = input.dataset.key;
            const value = input.value.trim();
            const itemDiv = input.closest('.translation-item');
            
            updateItemStatus(itemDiv, value, key);
            updateStats();
        }

        function updateItemStatus(itemDiv, value, key) {
            const statusBadge = itemDiv.querySelector('.status-badge');
            const errorDiv = itemDiv.querySelector('.error-message');
            const input = itemDiv.querySelector('.translation-input');
            
            const originalText = englishData[key];
            const originalPlaceholders = extractPlaceholders(originalText);
            const translationPlaceholders = extractPlaceholders(value);
            
            let isValid = true;
            let errorMessage = '';
            
            if (originalPlaceholders.length > 0) {
                const missingPlaceholders = originalPlaceholders.filter(p => !translationPlaceholders.includes(p));
                const extraPlaceholders = translationPlaceholders.filter(p => !originalPlaceholders.includes(p));
                
                if (missingPlaceholders.length > 0) {
                    isValid = false;
                    errorMessage = `Missing placeholders: ${missingPlaceholders.join(', ')}`;
                }
                
                if (extraPlaceholders.length > 0) {
                    isValid = false;
                    errorMessage += (errorMessage ? ' | ' : '') + `Extra placeholders: ${extraPlaceholders.join(', ')}`;
                }
            }

            const isExisting = itemDiv.dataset.type === 'existing';
            const baseClass = `translation-item ${isExisting ? 'existing' : 'new'}`;

            if (value === '') {
                itemDiv.className = baseClass;
                statusBadge.className = 'status-badge pending';
                statusBadge.textContent = 'Pending';
                input.classList.remove('error');
                errorDiv.classList.add('hidden');
                delete translations[key];
            } else if (!isValid) {
                itemDiv.className = baseClass + ' error';
                statusBadge.className = 'status-badge error';
                statusBadge.textContent = 'Error';
                input.classList.add('error');
                errorDiv.textContent = errorMessage;
                errorDiv.classList.remove('hidden');
                delete translations[key];
            } else {
                itemDiv.className = baseClass + ' completed';
                statusBadge.className = 'status-badge completed';
                statusBadge.textContent = 'Completed';
                input.classList.remove('error');
                errorDiv.classList.add('hidden');
                translations[key] = value;
            }

            if (value === '') {
                itemDiv.dataset.status = 'pending';
            } else if (!isValid) {
                itemDiv.dataset.status = 'error';
            } else {
                itemDiv.dataset.status = 'completed';
            }
        }

        function updateStats() {
            const totalItems = Object.keys(englishData).filter(key => 
                !key.startsWith('@') && key !== '@@locale' && typeof englishData[key] === 'string'
            ).length;
            
            const completed = Object.keys(translations).length;
            const remaining = totalItems - completed;
            const percentage = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;

            // Count new vs existing items
            const allItems = document.querySelectorAll('.translation-item');
            const newItemsCount = document.querySelectorAll('.translation-item[data-type="new"]').length;
            const existingItemsCount = document.querySelectorAll('.translation-item[data-type="existing"]').length;

            document.getElementById('totalItems').textContent = totalItems;
            document.getElementById('completedItems').textContent = completed;
            document.getElementById('remainingItems').textContent = remaining;
            document.getElementById('newItems').textContent = newItemsCount;
            document.getElementById('existingItems').textContent = existingItemsCount;
            document.getElementById('progressFill').style.width = percentage + '%';
            document.getElementById('progressText').textContent = percentage + '% Complete';

            const exportBtn = document.getElementById('exportBtn');
            const targetLanguage = document.getElementById('targetLanguage').value.trim();
            
            if (completed === totalItems && completed > 0 && targetLanguage) {
                exportBtn.disabled = false;
            } else {
                exportBtn.disabled = true;
            }
        }

        function updateTargetLanguage() {
            const value = document.getElementById('targetLanguage').value.trim();
            targetLocale = value;
            document.getElementById('targetLocaleDisplay').textContent = value || '-';
            updateStats(); 
        }

        function applyFilter() {
            const items = document.querySelectorAll('.translation-item');
            
            items.forEach(item => {
                const type = item.dataset.type;
                const status = item.dataset.status || (item.querySelector('.translation-input').value.trim() ? 'completed' : 'pending');
                let show = false;

                switch (currentFilter) {
                    case 'all':
                        show = true;
                        break;
                    case 'new':
                        show = type === 'new';
                        break;
                    case 'existing':
                        show = type === 'existing';
                        break;
                    case 'pending':
                        show = status === 'pending' || status === 'error';
                        break;
                    case 'completed':
                        show = status === 'completed';
                        break;
                }

                item.style.display = show ? 'block' : 'none';
            });
        }

        function exportARB() {
            const targetLanguage = document.getElementById('targetLanguage').value.trim();
            if (!targetLanguage) {
                alert('Please enter a target language code.');
                return;
            }

            const newARB = {
                '@@locale': targetLanguage
            };

            for (const [key, translation] of Object.entries(translations)) {
                newARB[key] = translation;
                
                const metaKey = `@${key}`;
                if (englishData[metaKey]) {
                    newARB[metaKey] = englishData[metaKey];
                }
            }

            const content = JSON.stringify(newARB, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `app_${targetLanguage}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert(`Translation exported successfully as app_${targetLanguage}.json!`);
        }