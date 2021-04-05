import { render } from 'preact';
import { res } from './utils';
import { model } from './settings-model';
import { App } from './components/app';
import { noop } from 'common/utils';

document.title = `KeeWeb Connect - ${res('optionsTitle')}`;

model.on('change', renderApp);
model.init().catch(noop);

renderApp();

function renderApp() {
    render(<App />, document.body);
}
