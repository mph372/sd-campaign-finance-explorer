# San Diego Campaign Finance Explorer

An interactive web application for exploring campaign finance data across San Diego County races. Built for consultants, lobbyists, reporters, and citizens who want to quickly analyze fundraising patterns and candidate financial activity.

## Features

- **Race-by-Race Analysis**: View all candidates in specific races side-by-side
- **Smart Data Aggregation**: Automatically sums contributions and expenditures across multiple filing periods while using the most recent cash on hand
- **Interactive Filtering**: Filter by jurisdiction/office/district or search for specific candidates
- **Sortable Tables**: Click any column header to sort by that metric
- **Detailed Candidate Views**: See complete filing history for any candidate
- **Professional Design**: Clean, responsive interface optimized for data analysis
- **Direct Links**: Access official campaign finance filings when available

## Data Structure

The application processes campaign finance data with the following aggregation logic:

- **Total Contributions**: Sum of all monetary contributions across all filing periods
- **Total Expenditures**: Sum of all expenditures across all filing periods  
- **Cash on Hand**: Uses the amount from the most recent filing (not aggregated)
- **Reports Filed**: Count of filing periods with actual data

## Technology

- **Framework**: Vanilla HTML/CSS/JavaScript (no dependencies)
- **Deployment**: Optimized for GitHub Pages
- **Data Format**: Processes CSV data into efficient JavaScript objects
- **Responsive**: Works on desktop, tablet, and mobile devices

## Usage

### For Consultants & Lobbyists
- Quickly assess fundraising strength across races
- Identify top fundraisers and competitive races
- Track candidate financial trajectories over time

### For Reporters
- Research candidate financing for stories
- Compare fundraising within specific races
- Access direct links to official filings

### For Citizens
- Understand who's funding campaigns in their area
- Compare candidates' financial resources
- Make informed voting decisions

## Local Development

1. Clone or download this repository
2. Open `index.html` in any modern web browser
3. No build process or dependencies required

## Updating Data

### Option 1: Automated Update (Recommended)

1. Replace `data/sd_campaign_finance.csv` with your updated CSV file
2. Run the update script:
   ```bash
   python3 update-data.py
   ```
3. Refresh your browser to see the updated data

### Option 2: Manual Update

1. Replace the data in `data/sd_campaign_finance.csv`
2. Manually update the `rawData` array in `js/data.js` to match the CSV structure
3. Refresh your browser

The automated script will preserve all the data processing logic and aggregation rules while updating the underlying data.

## GitHub Pages Deployment

This application is ready for immediate deployment to GitHub Pages:

1. Push this repository to GitHub
2. Go to Settings > Pages in your repository
3. Select "Deploy from a branch" and choose your main branch
4. Your site will be available at `https://yourusername.github.io/sd-campaign-finance-explorer`

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## File Structure

```
sd-campaign-finance-explorer/
├── index.html              # Main application page
├── css/
│   └── styles.css          # All styling and responsive design
├── js/
│   ├── data.js            # Campaign finance data and processing logic
│   └── app.js             # Main application functionality
├── data/
│   └── sd_campaign_finance.csv  # Original CSV data
└── README.md              # This file
```

## Data Sources

Campaign finance data is sourced from official government filings:
- San Diego County Registrar of Voters
- City of San Diego Ethics Commission  
- City of Chula Vista
- Other municipal filing systems

## License

This project is open source and available under the MIT License.
