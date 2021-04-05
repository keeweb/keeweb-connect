import { render } from 'preact';
import { res } from './utils';
import { model } from './settings-model';
import { App } from './components/app';

document.title = `KeeWeb Connect - ${res('optionsTitle')}`;

model.on('change', renderApp);
model.init();

renderApp();

function renderApp() {
    render(<App />, document.body);
}
