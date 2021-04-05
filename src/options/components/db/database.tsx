import { FunctionComponent } from 'preact';
import { res } from 'options/utils';
import { ConnectedDatabase, model } from 'options/settings-model';

type DatabaseProps = {
    db: ConnectedDatabase;
};

const Database: FunctionComponent<DatabaseProps> = ({ db }) => {
    const openDb = () => {
        model.openDatabase(db);
    };

    const closeDb = () => {
        model.closeDatabase(db);
    };

    const disconnectDb = () => {
        model.disconnectDatabase(db);
    };

    return (
        <tr>
            <td>{db.name}</td>
            <td>
                {db.open ? (
                    <span class="success">{res('optionsDatabaseStateOpen')}</span>
                ) : (
                    <span class="error">{res('optionsDatabaseStateClosed')}</span>
                )}
            </td>
            <td>
                {db.open ? (
                    <button class="secondary" onClick={closeDb}>
                        {res('optionsDatabaseActionClose')}
                    </button>
                ) : (
                    <button class="secondary" onClick={openDb}>
                        {res('optionsDatabaseActionOpen')}
                    </button>
                )}
                <button class="destructive" onClick={disconnectDb}>
                    {res('optionsDatabaseActionDisconnect')}
                </button>
            </td>
        </tr>
    );
};

export { Database };
