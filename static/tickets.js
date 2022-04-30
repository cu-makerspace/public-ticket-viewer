const _SHEET_ID = '1k0ZiJ1El2J1gxfqp6boEx7E2OTiSW87pCp_c9j0jv0Q'
const _API_KEY = 'AIzaSyDHaowMtvRwFaYBH--r4utAAd6XJ5bc-6c';
const _SHEET_RANGE = "A1:D1000";

const _COL_MAP = { 'UUID': 0, 'PRIORITY': 1, 'STATUS': 2, 'COST': 3 }

class TicketUtils {
  static isStatusWaiting(status) {
    return status.toLowerCase().includes('waiting to print')
  }
}

class TicketList {
  constructor(sheet_name) {
    this.GAPI_QUERY = `https://sheets.googleapis.com/v4/spreadsheets/${_SHEET_ID}/values/'${sheet_name}'!${_SHEET_RANGE}?key=${_API_KEY}`;
    this.__global_tickets = null;
    this.__global_tickets_lock = false;
    this.__number_of_waiting_tickets = 0;
    this.getSpreadsheetValues() // Perform inital page load
  }
  /**
   * @returns The total number of tickets that are waiting in the que to be printed.
   */
  getTotalWaitingTickets() {
    return this.__number_of_waiting_tickets;
  }

  /**
   * Filters the recived data and bring it into a more usable formats
   */
  handleNewData(data) {
    this.__global_tickets_lock = true;
    this.__global_tickets = [];
    this.__number_of_waiting_tickets = 0;
    // Convert to dict for readability and remove empty/invalid rows
    for (let r = 0; r < data.values.length; r++) {
      let row = data.values[r];
      if (row.length !== Object.keys(_COL_MAP).length) {
        continue;
      }
      this.__global_tickets.push({
        'uuid': row[_COL_MAP['UUID']],
        'priority': Number(row[_COL_MAP['PRIORITY']]),
        'status': row[_COL_MAP['STATUS']],
        'cost': row[_COL_MAP['COST']]
      });

      if (TicketUtils.isStatusWaiting(row[_COL_MAP['STATUS']]))
        this.__number_of_waiting_tickets++;
    };

    this.__global_tickets.sort((a, b) => { return b.priority - a.priority });
    this.__global_tickets_lock = false;
  }

  /**
   * Get and typecast data from the public-facing spreadsheet.
   * 
   * It is sadly not possible to query based on data (i.e. search), so instead we
   * take all available data and filter on the client.
   * 
   */
  getSpreadsheetValues() {
    return $.get({
      url: this.GAPI_QUERY,
      type: 'GET',
      dataType: 'json',
    }).done((data) => { this.handleNewData(data); })
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
  /**
   * Gets a shallow copy of the full list of tickets.
   * 
   * If tickets have not yet been loaded, this will load them.
   * 
   * @returns A promise containing the list of tickets when resolved.
   */
  getAllTickets(force_refresh = false) {
    return new Promise((resolve, reject) => {
      if (this.__global_tickets !== null && !force_refresh) {
        while (this.__global_tickets_lock === true) { }
        resolve(this.__global_tickets);
      }
      else {
        this.getSpreadsheetValues()
          .then(() => resolve(this.__global_tickets))
          .catch(error => reject(error));
      }
    });
  }

  /**
   * Get a list of tickets by IDs.
   * 
   * @param {Array} search_list An array of string IDs to search.
   * @returns An ordered array of IDs matching the tickets in __global_tickets.
   */
  async findTickets(search_list) {
    if (!Array.isArray(search_list)) search_list = [search_list];

    return new Promise((resolve, reject) => {
      this.getAllTickets().then((all_tickets) => {
        let unfound_tickets = search_list;
        let resulting_ids = [];

        for (let i = 0; i < all_tickets.length; i++) {
          let idx = unfound_tickets.findIndex((el) => { return (el === all_tickets[i]['uuid']) })
          if (idx >= 0) {
            resulting_ids.push(i);
            unfound_tickets.splice(idx, 1);
          }
        }

        resolve({ 'found': resulting_ids, 'not_found': unfound_tickets });
      }).catch((error) => reject(error));
    });
  }
}

const ultimaker_tickets = new TicketList('Ultimakers');
