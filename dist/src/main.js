import { mount } from '../runtime/svelte_svelte.js';
import App from './App.svelte.js';

const target = document.getElementById('app');
if (!target)
    throw new Error('Application mount element is missing');
mount(App, { target });
