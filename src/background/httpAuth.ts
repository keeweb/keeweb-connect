import { backend } from './backend';
import { BackendConnectionState } from 'common/backend-connection-state';
import BlockingResponse = chrome.webRequest.BlockingResponse;
import WebAuthenticationChallengeDetails = chrome.webRequest.WebAuthenticationChallengeDetails;
import WebResponseCacheDetails = chrome.webRequest.WebResponseCacheDetails;

export function interceptHttpBasicAuth(): void {
    const pendingRequests: string[] = [];

    function completed(requestDetails: WebResponseCacheDetails) {
        const index = pendingRequests.indexOf(requestDetails.requestId);
        if (index > -1) {
            pendingRequests.splice(index, 1);
        }
    }

    async function provideCredentials(
        requestDetails: WebAuthenticationChallengeDetails
    ): Promise<BlockingResponse> {
        // If we have seen this request before,
        // then assume our credentials were bad,
        // and give up.
        if (pendingRequests.indexOf(requestDetails.requestId) !== -1) {
            return {}; // the password we tried did not work
        }
        pendingRequests.push(requestDetails.requestId);

        await backend.connect();
        if (backend.state !== BackendConnectionState.Connected) {
            return {}; // Fallback to manual input, do NOT return {cancel: true} as it will show 401.
        }
        const logins = await backend.getLogins(requestDetails.url);
        if (!logins.length) {
            return {};
        }
        const record = logins[0]; // TODO: can't show a UI at this point, but how do we choose it?
        return { authCredentials: { username: record.login, password: record.password } };
    }

    const target = '*://*/*';
    chrome.webRequest.onAuthRequired.addListener(provideCredentials, { urls: [target] }, [
        'blocking'
    ]);
    chrome.webRequest.onCompleted.addListener(completed, { urls: [target] });
    chrome.webRequest.onErrorOccurred.addListener(completed, { urls: [target] });
}
