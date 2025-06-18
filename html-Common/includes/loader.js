// loader.js displays spinner when pages are loading

(function () {
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.innerHTML = `
    <div class="spinner"></div>
    <style>
      #loader {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: white;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .spinner {
        border: 8px solid #f3f3f3;
        border-top: 8px solid #3498db;
        border-radius: 50%;
        width: 100px; height: 100px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  document.body.appendChild(loader);

  window.addEventListener("load", () => {
    loader.remove();
  });
})();
