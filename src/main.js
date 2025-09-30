import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';
import { PixabayClient } from './api.js';

const refs = {
  form: null,
  queryInput: null,
  gallery: null,
  loadMoreBtn: null,
  loader: null,
  status: null,
};

const state = {
  currentQuery: '',
  totalHits: 0,
  loadedHits: 0,
};

const client = new PixabayClient({
  apiKey: import.meta.env.VITE_PIXABAY_KEY || '',
  perPage: 40,
});

let lightbox = null;

document.addEventListener('DOMContentLoaded', () => {
  refs.form = document.getElementById('search-form');
  refs.queryInput = document.getElementById('searchQuery');
  refs.gallery = document.getElementById('gallery');
  refs.loadMoreBtn = document.getElementById('load-more');
  refs.loader = document.getElementById('loader');
  refs.status = document.getElementById('status');

  refs.form.addEventListener('submit', onSearchSubmit);
  refs.loadMoreBtn.addEventListener('click', onLoadMore);

  lightbox = new SimpleLightbox('.gallery a', {
    captionsData: 'alt',
    captionDelay: 250,
  });
});

function showLoader(show) {
  refs.loader.hidden = !show;
}

function showLoadMore(show) {
  refs.loadMoreBtn.hidden = !show;
}

function setStatus(message) {
  if (!message) {
    refs.status.hidden = true;
    refs.status.textContent = '';
  } else {
    refs.status.hidden = false;
    refs.status.textContent = message;
  }
}

function clearGallery() {
  refs.gallery.innerHTML = '';
}

function renderImages(items) {
  const markup = items
    .map(
      ({ webformatURL, largeImageURL, tags, likes, views, comments, downloads }) => `
      <li class="photo-card">
        <a href="${largeImageURL}">
          <img src="${webformatURL}" alt="${escapeHtml(tags)}" loading="lazy" />
        </a>
        <ul class="info">
          <li><b>Likes</b> ${likes}</li>
          <li><b>Views</b> ${views}</li>
          <li><b>Comments</b> ${comments}</li>
          <li><b>Downloads</b> ${downloads}</li>
        </ul>
      </li>`
    )
    .join('');

  refs.gallery.insertAdjacentHTML('beforeend', markup);
  lightbox.refresh();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"]+/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  })[s]);
}

async function onSearchSubmit(event) {
  event.preventDefault();
  const query = refs.queryInput.value.trim();
  if (!query) {
    Notiflix.Notify.info('Please enter a search term.');
    return;
  }

  state.currentQuery = query;
  state.loadedHits = 0;
  state.totalHits = 0;
  clearGallery();
  showLoadMore(false);
  setStatus('');

  client.setQuery(query);
  client.resetPage();

  await fetchAndRender();
}

async function onLoadMore() {
  await fetchAndRender();
}

async function fetchAndRender() {
  try {
    showLoader(true);
    const { hits, totalHits } = await client.fetchImages();

    if (client.page === 1) {
      state.totalHits = totalHits;
      if (totalHits === 0) {
        Notiflix.Notify.failure('Sorry, there are no images matching your search query. Please try again.');
        showLoadMore(false);
        return;
      }
      Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
    }

    renderImages(hits);
    state.loadedHits += hits.length;

    // Smooth scroll by two card heights
    smoothScrollByTwoCards();

    // Pagination controls
    const hasMore = state.loadedHits < state.totalHits;
    showLoadMore(hasMore);
    if (!hasMore) {
      setStatus("We're sorry, but you've reached the end of search results.");
    } else {
      setStatus('');
    }

    client.incrementPage();
  } catch (error) {
    console.error(error);
    Notiflix.Notify.failure('Something went wrong. Please try again later.');
  } finally {
    showLoader(false);
  }
}

function smoothScrollByTwoCards() {
  const firstCard = refs.gallery.querySelector('.photo-card');
  if (!firstCard) return;
  const { height } = firstCard.getBoundingClientRect();
  window.scrollBy({ top: height * 2, behavior: 'smooth' });
}


