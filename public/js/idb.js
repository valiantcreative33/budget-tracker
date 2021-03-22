let db;
const request = indexedDB.open('budget', 1);

// checks if new version is available
request.onupgradeneeded = function (e) {
    const db = e.target.result;
    // creates object store called 'new_transaction' that auto increments for data retrieval 
    db.createObjectStore('new_activity', { autoIncrement: true });
};

request.onsuccess = function(e) {
    // When db is created either from upgrade mentioned above or a new connection, saves reference to the global variable above
    db = e.target.result;

    if (navigator.onLine) {
        uploadActivity();
    }
};

request.onerror = function(e) {
    console.log(e.target.errorCode);
};

// function executes if new activity is submitted without internet
function saveRecord(record) {

    // opens transaction with db with read and write permissions
    const transaction = db.transaction(['new_activity'], 'readwrite');

    // access object store for 'new_activity'
    const activityObjectStore = transaction.objectStore('new_activity');

    // adds new record to 'new_activity' objectStore
    activityObjectStore.add(record);
};

function uploadActivity() {

    const transaction = db.transaction(['new_activity'], 'readwrite');

    const activityObjectStore = transaction.objectStore('new_activity');

    const getAll = activityObjectStore.getAll();

    getAll.onsuccess = function() {
        // if data in indexedDb's store, send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverReponse => {
                    if (serverReponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_activity'], 'readwrite');
                    const activityObjectStore = transaction.objectStore('new_activity');
                    // clears all items in store
                    activityObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

// listen for the app to come back online
window.addEventListener('online', uploadActivity)