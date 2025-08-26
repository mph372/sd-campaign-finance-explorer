#!/usr/bin/env python3
"""
Script to automatically update the campaign finance data from CSV
Usage: python3 update-data.py
"""

import csv
import json
import os

def csv_to_js_data(csv_file_path):
    """Convert CSV file to JavaScript data format"""
    data = []
    
    with open(csv_file_path, 'r', encoding='utf-8-sig') as file:  # utf-8-sig handles BOM
        reader = csv.DictReader(file)
        for row in reader:
            # Clean up any potential BOM or whitespace in keys
            cleaned_row = {}
            for key, value in row.items():
                clean_key = key.strip().replace('\ufeff', '')  # Remove BOM if present
                cleaned_row[clean_key] = value
            data.append(cleaned_row)
    
    return data

def generate_js_file(data, output_path):
    """Generate the JavaScript data file"""
    
    js_content = '''// Campaign Finance Data
const rawData = '''
    
    # Convert to JSON with proper formatting
    js_content += json.dumps(data, indent=4)
    
    js_content += ''';

// Utility function to add UTM parameters to jurisdiction URLs
function getJurisdictionUrl(jurisdictionUrl) {
    if (!jurisdictionUrl || !jurisdictionUrl.startsWith('http')) {
        return '#';
    }
    
    const utmParams = new URLSearchParams({
        utm_source: 'sd_campaign_tracker',
        utm_medium: 'jurisdiction_link',
        utm_campaign: 'county_tracker'
    });
    
    const separator = jurisdictionUrl.includes('?') ? '&' : '?';
    return `${jurisdictionUrl}${separator}${utmParams.toString()}`;
}

// Utility function to parse currency strings
function parseCurrency(str) {
    if (!str || str === '') return 0;
    return parseFloat(str.replace(/[\\$,]/g, ''));
}

// Utility function to format currency
function formatCurrency(num) {
    if (num === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

// Process data to aggregate by candidate
function processData() {
    const candidateMap = new Map();
    
    rawData.forEach(record => {
        const key = `${record.candidate_name}_${record.jurisdiction}_${record.office}_${record.district}`;
        
        if (!candidateMap.has(key)) {
            candidateMap.set(key, {
                candidate_name: record.candidate_name,
                committee_name: record.committee_name,
                jurisdiction: record.jurisdiction,
                office: record.office,
                district: record.district,
                total_monetary_contributions: 0,
                total_loans_received: 0,
                total_contributions_sum: 0,
                total_expenditures_sum: 0,
                cash_on_hand: 0,
                outstanding_debt: 0,
                reports_filed: 0,
                latest_date_filed: '',
                link: record.link || '',
                reports: []
            });
        }
        
        const candidate = candidateMap.get(key);
        
        // Only process records with data
        if (record.monetary_contributions && record.monetary_contributions !== '') {
            candidate.total_monetary_contributions += parseCurrency(record.monetary_contributions);
            candidate.total_loans_received += parseCurrency(record.loans_received);
            candidate.total_contributions_sum += parseCurrency(record.total_contributions);
            candidate.total_expenditures_sum += parseCurrency(record.total_expenditures);
            candidate.reports_filed++;
            
            // Use the most recent cash on hand and outstanding debt
            const currentDate = new Date(record.date_filed);
            const latestDate = candidate.latest_date_filed ? new Date(candidate.latest_date_filed) : new Date('1970-01-01');
            
            if (currentDate >= latestDate) {
                candidate.cash_on_hand = parseCurrency(record.cash_on_hand);
                candidate.outstanding_debt = parseCurrency(record.outstanding_debt);
                candidate.latest_date_filed = record.date_filed;
                if (record.link) candidate.link = record.link;
            }
            
            candidate.reports.push({
                period: `${record.period_start} - ${record.period_end}`,
                date_filed: record.date_filed,
                monetary_contributions: parseCurrency(record.monetary_contributions),
                total_contributions: parseCurrency(record.total_contributions),
                total_expenditures: parseCurrency(record.total_expenditures),
                cash_on_hand: parseCurrency(record.cash_on_hand),
                link: record.link
            });
        }
    });
    
    return Array.from(candidateMap.values());
}

// Get unique races
function getRaces(processedData) {
    const raceSet = new Set();
    processedData.forEach(candidate => {
        const raceKey = `${candidate.jurisdiction} - ${candidate.office}${candidate.district ? ` District ${candidate.district}` : ''}`;
        raceSet.add(raceKey);
    });
    return Array.from(raceSet).sort();
}

// Filter candidates by race
function getCandidatesByRace(processedData, raceFilter) {
    if (!raceFilter || raceFilter === 'all') return processedData;
    
    return processedData.filter(candidate => {
        const candidateRace = `${candidate.jurisdiction} - ${candidate.office}${candidate.district ? ` District ${candidate.district}` : ''}`;
        return candidateRace === raceFilter;
    });
}

// Export processed data
const processedCandidates = processData();
const availableRaces = getRaces(processedCandidates);'''
    
    with open(output_path, 'w', encoding='utf-8') as file:
        file.write(js_content)

def main():
    # File paths
    csv_file = 'data/sd_campaign_finance.csv'
    js_output = 'js/data.js'
    
    # Check if CSV file exists
    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found!")
        print("Make sure you have updated the CSV file in the data/ folder.")
        return
    
    try:
        # Convert CSV to JavaScript data
        print("Reading CSV data...")
        data = csv_to_js_data(csv_file)
        
        print(f"Found {len(data)} records in CSV")
        
        # Generate JavaScript file
        print("Generating JavaScript data file...")
        generate_js_file(data, js_output)
        
        print(f"✅ Successfully updated {js_output}")
        print("🔄 Refresh your browser to see the updated data!")
        
    except Exception as e:
        print(f"❌ Error processing data: {e}")

if __name__ == "__main__":
    main()
