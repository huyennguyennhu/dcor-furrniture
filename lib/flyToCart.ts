export const flyToCart = (event: React.MouseEvent, imageSrc: string) => {
  const cartIcon = document.getElementById('header-cart-icon');
  if (!cartIcon) return;

  const buttonRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const targetRect = cartIcon.getBoundingClientRect();

  const flyImg = document.createElement('img');
  flyImg.src = imageSrc;
  flyImg.style.position = 'fixed';
  flyImg.style.left = `${buttonRect.left}px`;
  flyImg.style.top = `${buttonRect.top}px`;
  flyImg.style.width = '50px';
  flyImg.style.height = '50px';
  flyImg.style.objectFit = 'cover';
  flyImg.style.borderRadius = '50%';
  flyImg.style.zIndex = '999999';
  flyImg.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
  flyImg.style.pointerEvents = 'none';
  flyImg.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
  
  document.body.appendChild(flyImg);

  // Trigger animation after brief delay
  setTimeout(() => {
    flyImg.style.left = `${targetRect.left + targetRect.width / 2 - 10}px`;
    flyImg.style.top = `${targetRect.top + targetRect.height / 2 - 10}px`;
    flyImg.style.width = '20px';
    flyImg.style.height = '20px';
    flyImg.style.opacity = '0.2';
    flyImg.style.transform = 'scale(0.5)';
  }, 50);

  // Cleanup
  setTimeout(() => {
    if (document.body.contains(flyImg)) {
      document.body.removeChild(flyImg);
    }
    
    // Add a bounce effect to the cart icon
    cartIcon.style.transform = 'scale(1.2)';
    cartIcon.style.transition = 'transform 0.2s ease-out';
    setTimeout(() => {
      cartIcon.style.transform = 'scale(1)';
    }, 200);
  }, 850);
};
