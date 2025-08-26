// Application State
let currentCandidates = processedCandidates;
let currentSort = { column: null, direction: 'asc' };
let currentView = 'table'; // 'table' or 'race'

// DOM Elements
const raceFilter = document.getElementById('raceFilter');
const candidateSearch = document.getElementById('candidateSearch');
const clearFiltersBtn = document.getElementById('clearFilters');
const candidatesTableBody = document.getElementById('candidatesTableBody');
const statsSummary = document.getElementById('statsSummary');
const noResults = document.getElementById('noResults');
const candidateModal = document.getElementById('candidateModal');
const modalOverlay = document.getElementById('modalOverlay');
const closeModal = document.getElementById('closeModal');
const lastUpdated = document.getElementById('lastUpdated');

// View elements
const tableViewBtn = document.getElementById('tableViewBtn');
const raceViewBtn = document.getElementById('raceViewBtn');
const tableContainer = document.getElementById('tableContainer');
const raceGroupsContainer = document.getElementById('raceGroupsContainer');
const raceFilterGroup = document.getElementById('raceFilterGroup');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeRaceFilter();
    renderCandidates(currentCandidates);
    updateStatsSummary(currentCandidates);
    setupEventListeners();
    updateLastUpdatedDate();
});

// Initialize race filter dropdown
function initializeRaceFilter() {
    availableRaces.forEach(race => {
        const option = document.createElement('option');
        option.value = race;
        option.textContent = race;
        raceFilter.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    // View toggle
    tableViewBtn.addEventListener('click', () => switchView('table'));
    raceViewBtn.addEventListener('click', () => switchView('race'));
    
    // Race filter
    raceFilter.addEventListener('change', handleFilterChange);
    
    // Candidate search
    candidateSearch.addEventListener('input', handleFilterChange);
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', clearAllFilters);
    
    // Table sorting
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', handleSort);
    });
    
    // Modal controls
    closeModal.addEventListener('click', closeModalHandler);
    modalOverlay.addEventListener('click', closeModalHandler);
    
    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && candidateModal.style.display === 'block') {
            closeModalHandler();
        }
    });
    
    // Improve mobile touch experience for details buttons
    document.addEventListener('touchstart', function() {}, { passive: true });
    
    // Handle scroll hint visibility
    if (window.innerWidth <= 480) {
        setupScrollHint();
    }
    
    // Update scroll hint on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 480) {
            setupScrollHint();
        }
    });
}

// Setup scroll hint for mobile tables
function setupScrollHint() {
    const tableContainer = document.getElementById('tableContainer');
    if (tableContainer) {
        const table = tableContainer.querySelector('.candidates-table');
        if (table && table.scrollWidth > tableContainer.clientWidth) {
            tableContainer.classList.add('scrollable');
        } else {
            tableContainer.classList.remove('scrollable');
        }
    }
}

// Setup scroll hint for reports table in modal
function setupReportsScrollHint() {
    const reportsSection = document.querySelector('.reports-section');
    if (reportsSection) {
        const reportsTable = reportsSection.querySelector('.reports-table');
        const reportsRows = reportsTable ? reportsTable.querySelectorAll('tbody tr') : [];
        
        // Remove existing classes
        reportsSection.classList.remove('scrollable', 'single-row');
        
        if (reportsTable && reportsTable.scrollWidth > reportsSection.clientWidth) {
            reportsSection.classList.add('scrollable');
            
            // Add single-row class if there's only one data row
            if (reportsRows.length <= 1) {
                reportsSection.classList.add('single-row');
            }
        }
    }
}

// Handle filter changes
function handleFilterChange() {
    const raceValue = raceFilter.value;
    const searchValue = candidateSearch.value.toLowerCase().trim();
    
    let filteredCandidates = getCandidatesByRace(processedCandidates, raceValue);
    
    if (searchValue) {
        filteredCandidates = filteredCandidates.filter(candidate => 
            candidate.candidate_name.toLowerCase().includes(searchValue) ||
            candidate.committee_name.toLowerCase().includes(searchValue)
        );
    }
    
    currentCandidates = filteredCandidates;
    
    if (currentView === 'table') {
        renderCandidates(currentCandidates);
    } else {
        renderRaceGroups(currentCandidates);
    }
    
    updateStatsSummary(currentCandidates);
}

// Clear all filters
function clearAllFilters() {
    raceFilter.value = 'all';
    candidateSearch.value = '';
    currentCandidates = processedCandidates;
    currentSort = { column: null, direction: 'asc' };
    
    if (currentView === 'table') {
        renderCandidates(currentCandidates);
        // Reset table headers
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
    } else {
        renderRaceGroups(currentCandidates);
    }
    
    updateStatsSummary(currentCandidates);
}

// Handle table sorting
function handleSort(e) {
    const column = e.target.dataset.column;
    
    // Reset other headers
    document.querySelectorAll('.sortable').forEach(header => {
        if (header !== e.target) {
            header.classList.remove('sort-asc', 'sort-desc');
        }
    });
    
    // Determine sort direction
    let direction = 'asc';
    if (currentSort.column === column && currentSort.direction === 'asc') {
        direction = 'desc';
    }
    
    currentSort = { column, direction };
    
    // Update header classes
    e.target.classList.remove('sort-asc', 'sort-desc');
    e.target.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
    
    // Sort candidates
    const sortedCandidates = [...currentCandidates].sort((a, b) => {
        let aVal, bVal;
        
        switch (column) {
            case 'candidate_name':
                aVal = a.candidate_name.toLowerCase();
                bVal = b.candidate_name.toLowerCase();
                break;
            case 'race':
                aVal = `${a.jurisdiction} ${a.office} ${a.district}`.toLowerCase();
                bVal = `${b.jurisdiction} ${b.office} ${b.district}`.toLowerCase();
                break;
            case 'total_contributions_sum':
            case 'total_expenditures_sum':
            case 'cash_on_hand':
            case 'outstanding_debt':
            case 'reports_filed':
                aVal = a[column] || 0;
                bVal = b[column] || 0;
                break;
            default:
                return 0;
        }
        
        if (typeof aVal === 'string') {
            return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        } else {
            return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
    });
    
    renderCandidates(sortedCandidates);
}

// Render candidates table
function renderCandidates(candidates) {
    if (candidates.length === 0) {
        candidatesTableBody.innerHTML = '';
        noResults.style.display = 'block';
        document.querySelector('.table-container').style.display = 'none';
        return;
    }
    
    noResults.style.display = 'none';
    document.querySelector('.table-container').style.display = 'block';
    
    candidatesTableBody.innerHTML = candidates.map(candidate => {
        const raceDisplay = `${candidate.jurisdiction} - ${candidate.office}${candidate.district ? ` District ${candidate.district}` : ''}`;
        
        return `
            <tr>
                <td>
                    <div class="candidate-name">${candidate.candidate_name}</div>
                    <div class="committee-name">${candidate.committee_name}</div>
                </td>
                <td>
                    <div class="race-info">
                        <div class="jurisdiction">
                            <a href="${getJurisdictionUrl(candidate.jurisdiction)}" target="_blank" class="jurisdiction-link">
                                ${candidate.office}${candidate.district ? ` District ${candidate.district}` : ''}
                            </a>
                        </div>
                    </div>
                </td>
                <td class="currency ${getCurrencyClass(candidate.total_contributions_sum)}">
                    ${formatCurrency(candidate.total_contributions_sum)}
                </td>
                <td class="currency ${getCurrencyClass(candidate.total_expenditures_sum)}">
                    ${formatCurrency(candidate.total_expenditures_sum)}
                </td>
                <td class="currency ${getCurrencyClass(candidate.cash_on_hand)}">
                    ${formatCurrency(candidate.cash_on_hand)}
                </td>
                <td class="currency ${getCurrencyClass(candidate.outstanding_debt)}">
                    ${formatCurrency(candidate.outstanding_debt)}
                </td>
                <td class="reports-count">
                    ${candidate.reports_filed > 0 ? candidate.reports_filed : '<span class="no-reports">No 460s filed</span>'}
                </td>
                <td>
                    <button class="details-btn" onclick="showCandidateDetails('${candidate.candidate_name}', '${candidate.jurisdiction}', '${candidate.office}', '${candidate.district}')">
                        View Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update scroll hint after rendering
    if (window.innerWidth <= 480) {
        setTimeout(setupScrollHint, 100);
    }
}

// Get currency CSS class
function getCurrencyClass(amount) {
    if (amount > 0) return 'positive';
    if (amount < 0) return 'negative';
    return 'zero';
}

// Update stats summary
function updateStatsSummary(candidates) {
    const totalCandidates = candidates.length;
    const candidatesWithReports = candidates.filter(c => c.reports_filed > 0).length;
    const totalRaised = candidates.reduce((sum, c) => sum + (c.total_contributions_sum || 0), 0);
    const totalSpent = candidates.reduce((sum, c) => sum + (c.total_expenditures_sum || 0), 0);
    
    const raceFilter = document.getElementById('raceFilter').value;
    const isFiltered = raceFilter !== 'all' || document.getElementById('candidateSearch').value.trim() !== '';
    
    statsSummary.innerHTML = `
        <h3>${isFiltered ? 'Filtered Results' : 'All Candidates'}</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 15px;">
            <div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #2c3e50;">${totalCandidates}</div>
                <div style="font-size: 0.9rem; color: #7f8c8d;">Total Candidates</div>
            </div>
            <div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #2c3e50;">${candidatesWithReports}</div>
                <div style="font-size: 0.9rem; color: #7f8c8d;">Filed Reports</div>
            </div>
            <div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #27ae60;">${formatCurrency(totalRaised)}</div>
                <div style="font-size: 0.9rem; color: #7f8c8d;">Total Raised</div>
            </div>
            <div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #e74c3c;">${formatCurrency(totalSpent)}</div>
                <div style="font-size: 0.9rem; color: #7f8c8d;">Total Spent</div>
            </div>
        </div>
    `;
}

// Show candidate details in modal
function showCandidateDetails(candidateName, jurisdiction, office, district) {
    const candidate = processedCandidates.find(c => 
        c.candidate_name === candidateName && 
        c.jurisdiction === jurisdiction && 
        c.office === office && 
        c.district === district
    );
    
    if (!candidate) return;
    
    // Update modal content
    document.getElementById('modalCandidateName').textContent = candidate.candidate_name;
    
    // Candidate summary
    document.getElementById('modalCandidateSummary').innerHTML = `
        <div class="summary-item">
            <div class="label">Committee</div>
            <div class="value" style="font-size: 1rem; font-weight: 500;">${candidate.committee_name}</div>
        </div>
        <div class="summary-item">
            <div class="label">Race</div>
            <div class="value" style="font-size: 1rem; font-weight: 500;">
                <a href="${getJurisdictionUrl(candidate.jurisdiction)}" target="_blank" class="jurisdiction-link">
                    ${candidate.office}${candidate.district ? ` District ${candidate.district}` : ''}
                </a>
            </div>
        </div>
        <div class="summary-item">
            <div class="label">Total Raised</div>
            <div class="value ${getCurrencyClass(candidate.total_contributions_sum)}">${formatCurrency(candidate.total_contributions_sum)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Total Spent</div>
            <div class="value ${getCurrencyClass(candidate.total_expenditures_sum)}">${formatCurrency(candidate.total_expenditures_sum)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Cash on Hand</div>
            <div class="value ${getCurrencyClass(candidate.cash_on_hand)}">${formatCurrency(candidate.cash_on_hand)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Outstanding Debt</div>
            <div class="value ${getCurrencyClass(candidate.outstanding_debt)}">${formatCurrency(candidate.outstanding_debt)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Reports Filed</div>
            <div class="value">${candidate.reports_filed}</div>
        </div>
    `;
    
    // Reports table
    document.getElementById('modalReportsTableBody').innerHTML = 
        candidate.reports.map(report => `
            <tr>
                <td>${report.period}</td>
                <td>${report.date_filed}</td>
                <td class="currency ${getCurrencyClass(report.monetary_contributions)}">${formatCurrency(report.monetary_contributions)}</td>
                <td class="currency ${getCurrencyClass(report.loans_received)}">${formatCurrency(report.loans_received)}</td>
                <td class="currency ${getCurrencyClass(report.total_expenditures)}">${formatCurrency(report.total_expenditures)}</td>
                <td class="currency ${getCurrencyClass(report.cash_on_hand)}">${formatCurrency(report.cash_on_hand)}</td>
                <td class="currency ${getCurrencyClass(report.outstanding_debt)}">${formatCurrency(report.outstanding_debt)}</td>
                <td>${report.link ? `<a href="${report.link}" target="_blank">View Filing</a>` : 'N/A'}</td>
            </tr>
        `).join('');
    
    // Show modal
    candidateModal.style.display = 'block';
    modalOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Scroll to top of modal content on mobile
    if (window.innerWidth <= 768) {
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }
    
    // Setup scroll hint for reports table on mobile
    if (window.innerWidth <= 480) {
        setTimeout(setupReportsScrollHint, 100);
    }
}

// Close modal
function closeModalHandler() {
    candidateModal.style.display = 'none';
    modalOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Update last updated date
function updateLastUpdatedDate() {
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    lastUpdated.textContent = today;
}

// Switch between table and race views
function switchView(view) {
    currentView = view;
    
    // Update button states
    tableViewBtn.classList.toggle('active', view === 'table');
    raceViewBtn.classList.toggle('active', view === 'race');
    
    // Show/hide race filter in race view (not needed when grouping by race)
    raceFilterGroup.style.display = view === 'race' ? 'none' : 'flex';
    
    // Show/hide containers
    tableContainer.style.display = view === 'table' ? 'block' : 'none';
    raceGroupsContainer.style.display = view === 'race' ? 'block' : 'none';
    
    // Render appropriate view
    if (view === 'table') {
        renderCandidates(currentCandidates);
    } else {
        renderRaceGroups(currentCandidates);
    }
}

// Render race groups
function renderRaceGroups(candidates) {
    if (candidates.length === 0) {
        raceGroupsContainer.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    // Group candidates by race
    const raceGroups = {};
    candidates.forEach(candidate => {
        const raceKey = `${candidate.jurisdiction} - ${candidate.office}${candidate.district ? ` District ${candidate.district}` : ''}`;
        if (!raceGroups[raceKey]) {
            raceGroups[raceKey] = [];
        }
        raceGroups[raceKey].push(candidate);
    });
    
    // Sort candidates within each race by total contributions (descending)
    Object.keys(raceGroups).forEach(raceKey => {
        raceGroups[raceKey].sort((a, b) => (b.total_contributions_sum || 0) - (a.total_contributions_sum || 0));
    });
    
    // Render race groups
    raceGroupsContainer.innerHTML = Object.keys(raceGroups).sort().map(raceKey => {
        const raceCandidates = raceGroups[raceKey];
        const totalRaised = raceCandidates.reduce((sum, c) => sum + (c.total_contributions_sum || 0), 0);
        const candidatesWithReports = raceCandidates.filter(c => c.reports_filed > 0).length;
        
        return `
            <div class="race-group" id="race-${btoa(raceKey).replace(/[^A-Za-z0-9]/g, '')}">
                <div class="race-header" onclick="toggleRaceGroup('${btoa(raceKey).replace(/[^A-Za-z0-9]/g, '')}')">
                    <div>
                        <h3 class="race-title">${raceKey}</h3>
                        <p class="race-summary">${raceCandidates.length} candidates • ${candidatesWithReports} filed reports • ${formatCurrency(totalRaised)} total raised</p>
                    </div>
                    <span class="expand-icon">▼</span>
                </div>
                <div class="race-candidates">
                    ${raceCandidates.map(candidate => `
                        <div class="candidate-card">
                            <div class="candidate-info">
                                <h4>${candidate.candidate_name}</h4>
                                <p class="committee">${candidate.committee_name}</p>
                            </div>
                            <div class="candidate-metric">
                                <div class="label">Total Raised</div>
                                <div class="value ${getCurrencyClass(candidate.total_contributions_sum)}">${formatCurrency(candidate.total_contributions_sum)}</div>
                            </div>
                            <div class="candidate-metric">
                                <div class="label">Total Spent</div>
                                <div class="value ${getCurrencyClass(candidate.total_expenditures_sum)}">${formatCurrency(candidate.total_expenditures_sum)}</div>
                            </div>
                            <div class="candidate-metric">
                                <div class="label">Cash on Hand</div>
                                <div class="value ${getCurrencyClass(candidate.cash_on_hand)}">${formatCurrency(candidate.cash_on_hand)}</div>
                            </div>
                            <div class="candidate-metric">
                                <div class="label">Outstanding Debt</div>
                                <div class="value ${getCurrencyClass(candidate.outstanding_debt)}">${formatCurrency(candidate.outstanding_debt)}</div>
                            </div>
                            <div class="candidate-metric">
                                <div class="label">Reports</div>
                                <div class="value">${candidate.reports_filed > 0 ? candidate.reports_filed : '<span class="no-reports">No 460s filed</span>'}</div>
                            </div>
                            <div class="candidate-actions">
                                <button class="details-btn" onclick="showCandidateDetails('${candidate.candidate_name}', '${candidate.jurisdiction}', '${candidate.office}', '${candidate.district}')">
                                    View Details
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Toggle race group expansion
function toggleRaceGroup(raceId) {
    const raceGroup = document.getElementById(`race-${raceId}`);
    raceGroup.classList.toggle('expanded');
}
