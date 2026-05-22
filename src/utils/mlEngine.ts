import { pipeline, env } from '@xenova/transformers';

// Configure transformers to run 100% locally in-browser via CDN WASM binaries
env.allowLocalModels = false;

export interface DocChunk {
  id: string;
  title: string;
  category: string;
  content: string;
  sectionIndex: number; // 0: Home, 1: Projects, 2: About, 3: Contact
  projectKey?: 'nexturn' | 'redsea';
}

export const KNOWLEDGE_BASE: DocChunk[] = [
  {
    id: 'hero_visuals',
    title: 'Creative Developer & WebGL Portfolio',
    category: 'General',
    sectionIndex: 0,
    content: 'Kunal Saini is a creative developer operating under the handle Artificer. This portfolio is built with high-performance 3D graphics, customized GLSL tensor field shaders, React Three Fiber, WebGL weights matrix grids, and GSAP sticky scrollytelling.'
  },
  {
    id: 'redsea_ml',
    title: 'Project REDSEA Academic Research',
    category: 'Machine Learning',
    sectionIndex: 1,
    projectKey: 'redsea',
    content: 'Project REDSEA details Kunal Saini\'s academic research paper in advanced machine learning and artificial intelligence. Kunal designed custom deep neural networks, vector transformations, mathematical backpropagation optimization, and authored a comprehensive 50-page thesis under direct academic supervision.'
  },
  {
    id: 'nexturn_systems',
    title: 'Nexturn Connect Platform Architecture',
    category: 'Software Engineering',
    sectionIndex: 1,
    projectKey: 'nexturn',
    content: 'Nexturn Connect represents the system design and database platform engineered by Kunal Saini as Tech Head following the corporate merger. Features robust talent pipeline centralization, scalable PostgreSQL migrations, and ultra-high-throughput cloud interfaces.'
  },
  {
    id: 'about_stack',
    title: 'Developer Core Tech Stack & Tools',
    category: 'About',
    sectionIndex: 2,
    content: 'Kunal Saini (Artificer) specialized stack: React Three Fiber, Three.js, pure WebGL, custom GLSL fragment shaders, GSAP, TypeScript, Helix Editor, Ghostty Terminal, and Bun runner. Combines deep mathematical matrix operations with elite creative visual styles.'
  },
  {
    id: 'contact_comms',
    title: 'Establish Transmission & Hiring',
    category: 'Contact',
    sectionIndex: 3,
    content: 'Establish connection with Kunal Saini (Artificer) for elite contracting or full-time roles. Drop a secure transmission via the encrypted glass contact panel to initiate communication channels for scalable system design or interactive graphics.'
  }
];

let embedderPromise: Promise<any> | null = null;
let embedder: any = null;
const cachedEmbeddings: Map<string, number[]> = new Map();

// Initialize the Edge WebAssembly ML model and pre-embed local documents
export function initMLEngine(): Promise<any> {
  if (embedderPromise) return embedderPromise;

  embedderPromise = (async () => {
    try {
      console.log('[Edge ML] Initializing Xenova/all-MiniLM-L6-v2 embedding model in Wasm...');
      
      // Dispatch initial status
      window.dispatchEvent(new CustomEvent('ml-engine-status', {
        detail: { status: 'loading', progress: 0 }
      }));

      embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        progress_callback: (data: any) => {
          if (data.status === 'progress') {
            window.dispatchEvent(new CustomEvent('ml-engine-status', {
              detail: { status: 'loading', progress: data.progress || 0 }
            }));
          }
        }
      });

      console.log('[Edge ML] WebAssembly model loaded successfully. Pre-computing knowledge base embeddings...');

      // Pre-compute embeddings for the local knowledge base chunks
      for (const doc of KNOWLEDGE_BASE) {
        const result = await embedder(doc.content, { pooling: 'mean', normalize: true });
        const vector = Array.from(result.data) as number[];
        cachedEmbeddings.set(doc.id, vector);
      }

      console.log('[Edge ML] Knowledge base fully vectorized. System operational.');
      window.dispatchEvent(new CustomEvent('ml-engine-status', {
        detail: { status: 'ready', progress: 100 }
      }));

      return embedder;
    } catch (error) {
      console.error('[Edge ML] Critical initialization failure:', error);
      window.dispatchEvent(new CustomEvent('ml-engine-status', {
        detail: { status: 'error', error: String(error) }
      }));
      throw error;
    }
  })();

  return embedderPromise;
}

// Compute dot product of two normalized vectors (which equals cosine similarity)
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

export interface SearchResult {
  doc: DocChunk;
  score: number;
}

// Perform client-side semantic inference over the vectorized documentation
export async function semanticSearch(query: string): Promise<SearchResult[]> {
  try {
    const activeEmbedder = await initMLEngine();
    
    // Embed the query in-browser using WebAssembly
    const output = await activeEmbedder(query, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data) as number[];

    const results: SearchResult[] = [];

    // Score all documents using cosine similarity dot product
    for (const doc of KNOWLEDGE_BASE) {
      const docVector = cachedEmbeddings.get(doc.id);
      if (docVector) {
        const score = cosineSimilarity(queryVector, docVector);
        results.push({ doc, score });
      }
    }

    // Sort descending by highest semantic match
    return results.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('[Edge ML] Semantic search inference crashed:', error);
    // Graceful fallback to simple substring matching if WebAssembly fails
    console.log('[Edge ML] Falling back to fuzzy substring matcher...');
    const fallbacks = KNOWLEDGE_BASE.map(doc => {
      const q = query.toLowerCase();
      const content = doc.content.toLowerCase();
      const title = doc.title.toLowerCase();
      let score = 0;
      if (content.includes(q) || title.includes(q)) score = 0.8;
      else {
        const words = q.split(' ');
        let matches = 0;
        for (const w of words) {
          if (w.length > 2 && content.includes(w)) matches++;
        }
        score = matches / (words.length || 1);
      }
      return { doc, score };
    });
    return fallbacks.sort((a, b) => b.score - a.score);
  }
}
