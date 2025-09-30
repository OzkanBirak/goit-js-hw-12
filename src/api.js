import axios from 'axios';

const PIXABAY_BASE_URL = 'https://pixabay.com/api/';

export class PixabayClient {
  /**
   * @param {object} options
   * @param {string} options.apiKey - Pixabay API key
   * @param {number} [options.perPage=40] - Items per page (max 200, use 40 per task)
   */
  constructor({ apiKey, perPage = 40 }) {
    this.apiKey = apiKey;
    this.perPage = perPage;
    this.page = 1;
    this.query = '';

    this.http = axios.create({
      baseURL: PIXABAY_BASE_URL,
      timeout: 15000,
      params: {
        key: this.apiKey,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
      },
    });
  }

  setQuery(newQuery) {
    this.query = newQuery.trim();
  }

  resetPage() {
    this.page = 1;
  }

  incrementPage() {
    this.page += 1;
  }

  /**
   * Fetch images for current query and page
   * @returns {Promise<{hits: any[], total: number, totalHits: number}>}
   */
  async fetchImages() {
    if (!this.query) return { hits: [], total: 0, totalHits: 0 };

    const response = await this.http.get('', {
      params: {
        q: this.query,
        page: this.page,
        per_page: this.perPage,
      },
    });
    return response.data;
  }
}



