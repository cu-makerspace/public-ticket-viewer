const SHEET_ID = '1k0ZiJ1El2J1gxfqp6boEx7E2OTiSW87pCp_c9j0jv0Q'
const API_KEY = 'AIzaSyDHaowMtvRwFaYBH--r4utAAd6XJ5bc-6c';
const SHEET_RANGE = 'A1:C1000';
const GAPI_QUERY = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}?key=${API_KEY}`

const COL_MAP = { 'UUID': 0, 'PRIORITY': 1, 'STATUS': 2 }

let __global_tickets = null;
let __global_tickets_lock = false;
let __number_of_waiting_tickets = 0;

function statusIsWaiting(status) {
  return status.toLowerCase().includes('waiting to print')
}

function getTotalWaitingTickets() {
  return __number_of_waiting_tickets;
}

/**
 * Filter the recived data and bring it into a more usable formats
 */
function handleNewData(data) {
  __global_tickets_lock = true;
  __global_tickets = [];
  __number_of_waiting_tickets = 0;
  // Convert to dict for readability and remove empty/invalid rows
  for (let r = 0; r < data.values.length; r++) {
    let row = data.values[r];
    if (row.length !== Object.keys(COL_MAP).length) {
      continue;
    }
    __global_tickets.push({
      'uuid': row[COL_MAP['UUID']],
      'priority': Number(row[COL_MAP['PRIORITY']]),
      'status': row[COL_MAP['STATUS']]
    });

    if (statusIsWaiting(row[COL_MAP['STATUS']]))
      __number_of_waiting_tickets++;
  };

  __global_tickets.sort((a, b) => { return b.priority - a.priority });
  __global_tickets_lock = false;
}

/**
 * Get and typecast data from the public-facing spreadsheet.
 * 
 * It is sadly not possible to query based on data (i.e. search), so instead we
 * take all available data and filter on the client.
 * 
 */
function getSpreadsheetValues() {
  return $.get({
    url: GAPI_QUERY,
    type: 'GET',
    dataType: 'json',
  }).done((data) => { handleNewData(data); })
    .fail((xhr) => {
      let err = `${xhr.statusText} ${xhr.status}`;
      try {
        let response = JSON.parse(xhr.responseText);
        err += `\n${response.error.status} (${response.error.message})`
      } catch { }
      console.log(err);
      alert(err);
    });
}

function getAllTickets(force_refresh = false) {
  return new Promise(function (resolve, reject) {
    if (__global_tickets !== null && !force_refresh) {
      while (__global_tickets_lock === true) { }
      resolve(__global_tickets);
    }
    else {
      getSpreadsheetValues()
        .then(() => resolve(__global_tickets))
        .catch(error => reject(error));
    }
  });
}

/**
 * Find the list of tickets by ID.
 * 
 * @param {} search_list An array of string IDs to search.
 * @returns An ordered array of IDs matching the tickets in __global_tickets.
 */
async function findTickets(search_list) {
  if (!Array.isArray(search_list)) search_list = [search_list];

  return new Promise(function (resolve, reject) {
    getAllTickets().then((all_tickets) => {
      unfound_tickets = search_list;
      resulting_ids = [];

      for (let i = 0; i < all_tickets.length; i++) {
        let idx = unfound_tickets.findIndex((el) => { return (el === all_tickets[i]['uuid']) })
        if (idx >= 0) {
          resulting_ids.push(i);
          unfound_tickets.splice(idx, 1);
        }
      }

      resolve({'found': resulting_ids, 'not_found': unfound_tickets});
    }).catch((error) => reject(error));
  });
}

function testTicketSearch() {
  findTickets(['34634334290', '37675968758', '38857817400']).then((result) => {
    console.log(result);
  })
}
