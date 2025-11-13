document.addEventListener('DOMContentLoaded', () => {

    const swiper = new Swiper('.swiper-container', {
        loop: false,
        simulateTouch: true, 
        touchMoveStopPropagation: false,
        
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        on: {
            slideChange: () => {
                if (selectedTextElement) {
                    selectedTextElement.classList.remove('active');
                    selectedTextElement.removeAttribute('contenteditable');
                }
                document.getElementById('text-edit-panel').style.display = 'none';
                selectedTextElement = null; 
            }
        }
    });

    let selectedTextElement = null;
    let isDragging = false;
    let isClicking = false;
    let startClientX, startClientY, currentElX, currentElY;

    const rgbToHex = (rgb) => {
        if (rgb.startsWith('#')) return rgb;
        if (!rgb || rgb.indexOf('rgb') === -1) return '#000000'; 
        const [r, g, b] = rgb.match(/\d+/g).map(Number);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    const updateEditorPanel = () => {
        if (!selectedTextElement) return;

        const style = window.getComputedStyle(selectedTextElement);
        const currentFontFamily = style.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
        const currentFontSize = style.fontSize;
        const currentColor = selectedTextElement.style.color || style.color;
        const currentAlign = style.textAlign;

        document.getElementById('font-family').value = currentFontFamily;
        document.getElementById('font-size').value = currentFontSize;
        document.getElementById('font-color').value = rgbToHex(currentColor);

        document.querySelectorAll('.alignment-buttons button').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-white', 'text-gray-700');

            if (btn.dataset.align === currentAlign) {
                btn.classList.remove('bg-white', 'text-gray-700');
                btn.classList.add('bg-blue-600', 'text-white');
            }
        });
    };

    const startDrag = (e) => {
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        const target = e.target.closest('.draggable-text');
        
        if (!target) {
            if (selectedTextElement) {
                selectedTextElement.classList.remove('active');
                selectedTextElement.removeAttribute('contenteditable');
            }
            selectedTextElement = null;
            document.getElementById('text-edit-panel').style.display = 'none';
            return;
        }

        if (target.closest('.swiper-slide').dataset.slideIndex != swiper.activeIndex) return;
        
        if (selectedTextElement && selectedTextElement !== target) {
            selectedTextElement.classList.remove('active');
            selectedTextElement.removeAttribute('contenteditable');
        }
        selectedTextElement = target;
        selectedTextElement.classList.add('active');
        
        document.getElementById('text-edit-panel').style.display = 'flex';
        updateEditorPanel();
        
        isDragging = false;
        isClicking = true;
        
        startClientX = clientX;
        startClientY = clientY;

        const rect = selectedTextElement.getBoundingClientRect();
        currentElX = rect.left;
        currentElY = rect.top;
    };

    const dragMove = (e) => {
        if (!selectedTextElement || !isClicking) return;

        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        const dx = Math.abs(clientX - startClientX);
        const dy = Math.abs(clientY - startClientY);

        if (isDragging || dx > 5 || dy > 5) {
            isDragging = true;
            selectedTextElement.removeAttribute('contenteditable'); 
            selectedTextElement.style.cursor = 'grabbing';
            e.preventDefault();

            const imageArea = selectedTextElement.closest('.image-area');
            if (!imageArea) return;

            const containerRect = imageArea.getBoundingClientRect();
            const elWidth = selectedTextElement.offsetWidth;
            const elHeight = selectedTextElement.offsetHeight;
            
            let newX_px = currentElX + (clientX - startClientX) - containerRect.left;
            let newY_px = currentElY + (clientY - startClientY) - containerRect.top;

            newX_px = Math.max(0, Math.min(newX_px, containerRect.width - elWidth));
            newY_px = Math.max(0, Math.min(newY_px, containerRect.height - elHeight));

            const newX_perc = (newX_px / containerRect.width) * 100;
            const newY_perc = (newY_px / containerRect.height) * 100;

            selectedTextElement.style.left = `${newX_perc}%`;
            selectedTextElement.style.top = `${newY_perc}%`;
            selectedTextElement.style.transform = 'none';
        }
    };

    const dragEnd = () => {
        if (selectedTextElement) {
            selectedTextElement.style.cursor = 'grab';
            
            if (!isDragging) {
                selectedTextElement.setAttribute('contenteditable', 'true');
                selectedTextElement.focus();
            }
        }
        isDragging = false;
        isClicking = false;
    };

    document.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);

    document.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('touchend', dragEnd);

    document.getElementById('add-text-btn').addEventListener('click', () => {
        const activeSlide = document.querySelector('.swiper-slide-active .image-area');
        if (!activeSlide) return;

        if (selectedTextElement) {
            selectedTextElement.classList.remove('active');
            selectedTextElement.removeAttribute('contenteditable');
        }

        const newText = document.createElement('div');
        newText.classList.add('draggable-text', 'active');
        
        newText.innerText = 'New Text Box';
        newText.style.cssText = 'color: #333; font-family: Arial; font-size: 20px; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;';

        activeSlide.appendChild(newText);
        
        selectedTextElement = newText;
        document.getElementById('text-edit-panel').style.display = 'flex';
        updateEditorPanel();
        
        newText.setAttribute('contenteditable', 'true');
        newText.focus(); 
    });
    
    document.getElementById('text-edit-panel').addEventListener('change', (e) => {
        if (!selectedTextElement) return;
        
        const target = e.target;
        
        if (target.id === 'font-family') {
            selectedTextElement.style.fontFamily = `'${target.value}'`;
        } else if (target.id === 'font-size') {
            selectedTextElement.style.fontSize = target.value;
        } else if (target.id === 'font-color') {
            selectedTextElement.style.color = target.value;
        }
    });

    document.querySelectorAll('.alignment-buttons button').forEach(button => {
        button.addEventListener('click', () => {
            if (!selectedTextElement) return;

            const align = button.dataset.align;
            selectedTextElement.style.textAlign = align;

            document.querySelectorAll('.alignment-buttons button').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-white', 'text-gray-700');
            });
            button.classList.remove('bg-white', 'text-gray-700');
            button.classList.add('bg-blue-600', 'text-white');
        });
    });
    
    document.getElementById('delete-text-btn').addEventListener('click', () => {
        if (!selectedTextElement) return;

        selectedTextElement.remove();

        selectedTextElement = null;
        document.getElementById('text-edit-panel').style.display = 'none';
    });
});