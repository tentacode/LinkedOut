function hideSuggestions() {
  const headers = document.querySelectorAll('.update-components-header__text-view');
  
  headers.forEach(header => {
    if (header.textContent.trim() === 'Suggestions') {
      const post = header.closest('.feed-shared-update-v2');
      if (post) {
        post.style.display = 'none';
      }
    }
  });
}

hideSuggestions();

const observer = new MutationObserver(hideSuggestions);
observer.observe(document.body, { 
  childList: true, 
  subtree: true 
});