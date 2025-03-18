window.addEventListener('DOMContentLoaded', () => {
  const helloMessage = document.createElement('div');
  helloMessage.innerText = 'Hello, World!';

  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.appendChild(helloMessage);
  }
});
