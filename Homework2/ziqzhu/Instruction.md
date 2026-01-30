## Setup
I want to use svelte-ts and D3 for this project. All the code should be in ziqzhu directory.

## Dataset

**File**: [`spotify_data clean.csv`](./spotify_data%20clean.csv)
**Size**: 8,582 tracks × 15 columns
**Time Range**: 1952-2025 (majority 2009-2025, peak in 2023-2025)

### Columns Structure
- **Track info**: `track_id`, `track_name`, `track_number`, `track_popularity` (0-99), `explicit` (bool), `track_duration_min` (0.07-13.51 min, avg 3.49)
- **Artist info**: `artist_name`, `artist_popularity` (0-100), `artist_followers`, `artist_genres` (60.8% have data, 430 unique genres)
- **Album info**: `album_id`, `album_name`, `album_release_date`, `album_total_tracks`, `album_type` (album 68%, single 26%, compilation 6%)

### Key Data Insights
- **Artist distribution**: Highly skewed - Taylor Swift (324 tracks), The Weeknd (141), Lana Del Rey (99)
- **Top followers**: Taylor Swift (145M), Ed Sheeran (123M), Billie Eilish (119M)
- **Top genres**: pop (920), country (680), soundtrack (450), hip hop (431), indie (376), folk (337), rock (327)
- **Explicit content**: 25% of tracks, correlates with higher popularity
- **Correlations**:
  - Artist popularity ↔ Track popularity: 0.467 (moderate)
  - Duration ↔ Track popularity: 0.106 (weak, but positive)
  - Longer tracks slightly more popular (Q4: 3.65min avg vs Q1: 3.33min)
- **Missing data**: 39.2% tracks lack genre info (3,361 tracks)

## Visualization Plan (Final Selection)

### Dashboard Overview

This dashboard will feature three complementary visualizations that explore different dimensions of the Spotify music dataset:

1. **Temporal Analysis**: Stacked Area Chart showing genre evolution over time
2. **Correlation Analysis**: Hexbin Density Plot revealing relationship between artist fame and track success
3. **Categorical Comparison**: Stacked Bar Chart comparing genre characteristics

### Detailed Visualization Specifications

#### **Visualization 1: Stacked Area Chart - Music Trends Over Time (2009-2025)** (Advanced)

**Purpose**: Shows temporal evolution of music landscape and genre dominance shifts

**Specifications**:
- **X-axis**: Year (2009-2025, 17 years)
  - Scale: `d3.scaleTime()`
  - Format: 4-digit year (e.g., "2015", "2020", "2025")
  - Tick spacing: Every 2-3 years for readability

- **Y-axis**: Number of tracks released
  - Scale: `d3.scaleLinear()` starting from 0
  - Format: Whole numbers with comma separators (e.g., "500", "1,000")
  - Stacked values showing cumulative track counts

- **Stacking**: Top 6-7 genres + "Other" category
  - **Top genres to include**: pop, country, hip hop, rock, indie, folk (+ soundtrack or rap)
  - Genres with <50 tracks grouped into "Other"
  - Use `d3.stack()` for data transformation
  - Consider `d3.stackOffsetWiggle()` or `d3.stackOffsetSilhouette()` for aesthetic appeal

- **Visual encoding**:
  - Area: Quantity of tracks
  - Vertical position: Temporal progression
  - Color hue: Genre category (qualitative scale)
  - Smooth curves: Use `d3.curveMonotoneX()` or `d3.curveBasis()` for aesthetic flow

**Data Processing**:
1. Parse `album_release_date` to extract year
2. Filter to 2009-2025 (where data is dense)
3. Group by year and genre
4. Count tracks per year-genre combination
5. Reshape data for stacking (array of objects with year + genre counts)

**Why it's advanced**:
- Stack layout algorithm with offset calculation
- Temporal aggregation and data transformation
- Smooth area interpolation
- Handles 430 genres collapsed into meaningful categories

**Expected insights**:
- Surge in releases 2023-2025 (765, 648, 523 tracks)
- Genre dominance patterns (pop consistently on top?)
- Whether certain genres have grown/declined over time

---

#### **Visualization 2: Hexbin Density Plot - Popularity vs Artist Followers** (Advanced)

**Purpose**: Reveals whether artist fame guarantees track success (tests 0.467 correlation)

**Specifications**:
- **X-axis**: Artist followers
  - Scale: `d3.scaleLog()` (logarithmic for better distribution)
  - Range: ~200K to 145M
  - Format: "1M", "10M", "100M" using `d3.format('.2s')`
  - Log scale needed due to extreme range (Taylor Swift: 145M vs emerging: <1M)

- **Y-axis**: Track popularity (0-99)
  - Scale: `d3.scaleLinear()`
  - Format: Whole numbers
  - Domain: [0, 100] for consistency

- **Hexagonal binning**:
  - Use `d3.hexbin()` to aggregate overlapping points
  - Hexagon size: ~15-20 pixels radius (adjust based on canvas size)
  - Each hexagon represents track density at that followers/popularity intersection

- **Visual encoding**:
  - Position (X, Y): Artist followers × Track popularity
  - Color intensity: Number of tracks in hex (sequential scale)
  - Color scheme: Yellow → Orange → Red (represents "heat"/density)
  - Use `d3.interpolateYlOrRd` or `d3.interpolateViridis`

**Data Processing**:
1. Extract (artist_followers, track_popularity) pairs for all 8,582 tracks
2. Remove outliers if needed (tracks with 0 popularity? or keep to show reality)
3. Apply hexbin aggregation with appropriate radius
4. Calculate density (count) for each hexagon
5. Normalize color scale based on max density

**Why it's advanced**:
- Hexagonal binning algorithm (not trivial to implement)
- Logarithmic scale handling
- Density visualization technique
- Handles massive overplotting (8,582 points)

**Expected insights**:
- Does high follower count guarantee popularity? (Correlation: 0.467 = moderate)
- Are there "sleeper hits" (low followers, high popularity)?
- Do mega-stars have flops? (high followers, low popularity)?
- Density clusters reveal typical patterns

---

#### **Visualization 3: Stacked Bar Chart - Genre Characteristics**

**Purpose**: Compares characteristics across genres to reveal genre-specific patterns

**Specifications**:
- **X-axis**: Top 10-12 genres by track count
  - Genres: pop, country, soundtrack, hip hop, indie, folk, rock, rap, (+ 2-4 more)
  - Order: By total track count (descending)
  - Labels: Genre names, angled -45° if needed for space

- **Y-axis**: Dual encoding approach
  - **Option A - Stacked segments** (3 metrics normalized to 100%):
    - Explicit content percentage (% of tracks that are explicit)
    - Clean content percentage (% of tracks that are clean)
    - Shows relative proportions

  - **Option B - Grouped bars** (3 separate bars per genre):
    - Bar 1: % Explicit content (0-100%)
    - Bar 2: Average track duration (minutes, rescaled)
    - Bar 3: Average track popularity (0-100)
    - Use different colors for each metric

- **Visual encoding**:
  - Position (X): Genre category
  - Length/Height: Metric value
  - Color hue: Metric type (explicit %, duration, popularity)
  - Stacking: If using stacked approach, explicit vs clean

**Data Processing**:
1. Filter to tracks with genre information (60.8% of dataset)
2. Parse genre strings (comma-separated, in brackets)
3. For each genre, calculate:
   - Total track count
   - % explicit (count where explicit=True / total)
   - Average duration (mean of track_duration_min)
   - Average popularity (mean of track_popularity)
4. Select top 10-12 genres by track count
5. Normalize/scale values for visual comparison

**Implementation choice**: **Grouped bars recommended** over stacked
- Easier to compare exact values across metrics
- All three metrics visible simultaneously
- Clearer for showing if certain genres have more explicit content

**Expected insights**:
- Do certain genres have more explicit content? (e.g., hip hop/rap vs country?)
- Are certain genres' tracks longer? (rock vs pop?)
- Which genres have higher average popularity?
- Genre stereotypes confirmed or debunked by data

### Final Dashboard Design

**Three-view layout** exploring temporal, correlation, and categorical dimensions:

---

### **Visualization 1: Stacked Area Chart** (Top/Full-width)
- **Position**: Top row, spanning full width
- **Size**: ~1200px width × 400-500px height
- **Role**: Temporal overview showing 17 years of music evolution
- **Questions answered**:
  - How has music release volume changed over time?
  - Which genres have grown or declined?
  - When was the "golden age" for different genres?

---

### **Visualization 2: Hexbin Density Plot** (Bottom-left)
- **Position**: Bottom-left quadrant
- **Size**: ~550px × 500px
- **Role**: Correlation analysis between artist fame and track success
- **Questions answered**:
  - Does artist fame guarantee track popularity?
  - Are there "sleeper hits" from unknown artists?
  - Do mega-stars ever produce unpopular tracks?
  - What's the typical followers-to-popularity relationship?

---

### **Visualization 3: Stacked/Grouped Bar Chart** (Bottom-right)
- **Position**: Bottom-right quadrant
- **Size**: ~550px × 500px
- **Role**: Genre comparison across multiple characteristics
- **Questions answered**:
  - Which genres have more explicit content?
  - Do certain genres produce longer tracks?
  - Which genres achieve higher popularity on average?
  - How do genre stereotypes hold up to data?

**Why this layout works**:
1. **Hierarchical importance**: Area chart gets prominence (top, full-width)
2. **Visual flow**: Temporal → detailed analysis (top-down)
3. **Comparative pairing**: Two detailed views side-by-side for cross-reference
4. **Screen utilization**: Fills fullscreen browser efficiently
5. **Responsive**: Can stack vertically on smaller screens

**Dashboard coherence**:
- ✅ **Three aggregation levels**: Time-Genre → Track-level → Genre-level
- ✅ **Three analysis types**: Temporal trends + Correlation + Categorical comparison
- ✅ **Two advanced techniques**: Hexbin density + Stacked area with temporal aggregation
- ✅ **Different data dimensions**:
  - Time series (area chart)
  - Two quantitative variables (hexbin)
  - Multiple categorical attributes (bar chart)
- ✅ **Complementary insights**: Each view reveals different aspect of music landscape
- ✅ **HW2 requirements**: Overview (area), detail (hexbin, bars), advanced techniques, different dimensions

### Visual Encoding & Design Rationale

**Effectiveness Hierarchy** (following Munzner's principles):

Each visualization uses the most effective encodings for its data type:

1. **Stacked Area Chart**:
   - **Position (X)**: Time (2009-2025) - most effective for ordered data
   - **Area/Vertical position (Y)**: Track quantity - effective for showing magnitude and trends
   - **Color hue**: Genre category - qualitative distinction
   - **Stacking**: Shows both individual genre trends and total volume

2. **Hexbin Density Plot**:
   - **Position (X, Y)**: Artist followers × Track popularity - most effective for quantitative correlation
   - **Color saturation**: Density (count) - effective for showing concentration
   - **Hexagonal shape**: Better than rectangles for uniform coverage

3. **Grouped Bar Chart**:
   - **Position (X)**: Genre category - effective for nominal data
   - **Length (Y)**: Metric values - highly effective for comparison
   - **Color hue**: Metric type (3 different colors for 3 metrics)
   - **Grouping**: Enables direct comparison across genres

**Color Palette Design**:

**1. Stacked Area Chart (Genres)**:
- Use **D3.schemeTableau10** or **D3.schemeCategory10** (colorblind-safe)
- Assign consistent colors across dashboard:
  ```javascript
  const genreColors = {
    'pop': '#e45756',        // Pink-red
    'country': '#f58518',    // Orange
    'hip hop': '#72b7b2',    // Teal
    'rock': '#54a24b',       // Green
    'indie': '#eeca3b',      // Yellow
    'folk': '#b279a2',       // Purple
    'rap': '#ff9da6',        // Light pink
    'other': '#9d755d'       // Brown
  }
  ```

**2. Hexbin Density Plot**:
- Sequential color scheme: **YlOrRd** (Yellow → Orange → Red)
- Represents "heat" / density concentration
- Alternative: **Viridis** (colorblind-safe, perceptually uniform)
- Use `d3.interpolateYlOrRd` or `d3.scaleSequential(d3.interpolateViridis)`

**3. Grouped Bar Chart** (3 metrics):
- **Explicit %**: `#e15759` (red - warning/adult content)
- **Avg Duration**: `#4e79a7` (blue - neutral, time-related)
- **Avg Popularity**: `#59a14f` (green - success/positive)
- Distinct hues ensure easy differentiation

**Branding**:
- Dashboard header: Spotify green (#1db954)
- Consistent typography and spacing
- White backgrounds for charts with subtle gray borders

**Accessibility Checklist**:
- ✅ Colorblind-safe palettes (avoid red-green for critical distinctions)
- ✅ Multiple encodings (not color-only): position, length, area used
- ✅ Clear legends with text labels for all color mappings
- ✅ Axis labels with readable font sizes (14px+)
- ✅ Sufficient contrast ratios (WCAG AA: 4.5:1 for text)
- ✅ Tooltips on hover for additional context

### Future Interactivity (HW3 Planning)

**Coordinated Interactions Across Three Views:**

**1. Stacked Area Chart (Temporal)**:
- **Brush selection**: Drag to select time range (e.g., 2020-2023)
  - → Updates hexbin to show only tracks from selected years
  - → Updates bar chart to show genre stats for selected time period
- **Click genre area**: Click on a genre's area
  - → Highlights that genre across all views
  - → Filters hexbin to show only tracks from that genre
  - → Highlights corresponding bar in bar chart
- **Legend interaction**: Click genre in legend
  - → Same as clicking area (filter/highlight that genre)
  - → Toggle visibility to focus on subset of genres
- **Hover**: Show tooltip with exact count for year-genre combination

**2. Hexbin Density Plot (Correlation)**:
- **Click hexagon**: Select all tracks within that hex
  - → Highlights time periods in area chart when those tracks were released
  - → Shows which genres those tracks belong to (if filtered by genre)
- **Brush/Lasso selection**: Draw region to select multiple hexagons
  - → Filter other views to show only selected tracks' characteristics
- **Hover**: Show tooltip with:
  - Number of tracks in hexagon
  - Follower range and popularity range
  - Example artist names in that range

**3. Grouped Bar Chart (Genre Comparison)**:
- **Click genre bar**: Select a genre
  - → Highlights that genre in area chart
  - → Filters hexbin to show only tracks from that genre
- **Click metric bar**: Select a specific metric (explicit %, duration, or popularity)
  - → Sort genres by that metric
  - → Highlight relevant dimension in other views
- **Hover**: Show exact values for all three metrics

**Cross-View Filtering Scenarios:**

**Scenario 1 - Temporal + Genre Exploration**:
1. User brushes 2018-2020 in area chart
2. Hexbin updates to show only tracks from those years
3. Bar chart updates to show genre stats for 2018-2020
4. User sees how genre characteristics differ in that period vs overall

**Scenario 2 - Artist Fame Investigation**:
1. User clicks high-density hex in hexbin (high followers, high popularity)
2. Area chart highlights when those successful tracks were released
3. Bar chart shows which genres those successful tracks belong to
4. Reveals: "Do successful tracks cluster in certain genres/time periods?"

**Scenario 3 - Genre Deep Dive**:
1. User clicks "hip hop" in bar chart
2. Area chart highlights hip hop's trajectory over time
3. Hexbin filters to show only hip hop tracks' fame-success relationship
4. Reveals: "Does hip hop follow same fame-success pattern as other genres?"

**Technical Implementation (HW3)**:
- Shared state management (Svelte stores or props)
- Event dispatching between components
- D3 brush for temporal selection: `d3.brush()` or `d3.brushX()`
- Lasso selection for hexbin: Custom SVG path drawing
- Transition animations when filtering: `d3.transition().duration(750)`
- Clear filter button to reset all views

---

## Implementation Notes

### Data Processing Pipeline

**Step 1: Load and Clean Data**
```javascript
const data = await d3.csv('/data/spotify_data clean.csv', d => ({
  track_id: d.track_id,
  track_name: d.track_name,
  track_popularity: +d.track_popularity,
  explicit: d.explicit === 'TRUE',
  artist_name: d.artist_name,
  artist_followers: +d.artist_followers,
  artist_genres: d.artist_genres,
  album_release_date: d.album_release_date,
  track_duration_min: +d.track_duration_min
}));
```

**Step 2: Parse Genres**
```javascript
function parseGenres(genreString) {
  if (!genreString || genreString === 'NaN') return [];
  // Remove brackets and quotes, split by comma
  return genreString
    .replace(/[\[\]'"]/g, '')
    .split(',')
    .map(g => g.trim())
    .filter(g => g.length > 0);
}
```

**Step 3: Categorize into Top Genres + Other**
```javascript
const topGenres = ['pop', 'country', 'hip hop', 'rock', 'indie', 'folk', 'rap'];
function categorizeGenre(genres) {
  if (!genres || genres.length === 0) return 'unknown';
  for (let genre of genres) {
    if (topGenres.includes(genre)) return genre;
  }
  return 'other';
}
```

**Step 4: Process for Each Visualization**

*For Stacked Area Chart*:
```javascript
// Parse dates and filter to 2009-2025
const filteredData = data
  .map(d => ({...d, year: new Date(d.album_release_date).getFullYear()}))
  .filter(d => d.year >= 2009 && d.year <= 2025);

// Aggregate by year and genre
const yearGenreCounts = d3.rollup(
  filteredData,
  v => v.length,
  d => d.year,
  d => categorizeGenre(parseGenres(d.artist_genres))
);

// Convert to array format for d3.stack()
const stackData = Array.from(yearGenreCounts, ([year, genres]) => {
  const obj = { year };
  topGenres.concat(['other']).forEach(genre => {
    obj[genre] = genres.get(genre) || 0;
  });
  return obj;
}).sort((a, b) => a.year - b.year);
```

*For Hexbin Density Plot*:
```javascript
// Extract followers-popularity pairs
const hexbinData = data
  .filter(d => d.artist_followers > 0 && d.track_popularity > 0)
  .map(d => [d.artist_followers, d.track_popularity]);
```

*For Grouped Bar Chart*:
```javascript
// Calculate genre statistics
const genreStats = d3.rollup(
  data.filter(d => d.artist_genres),
  v => ({
    explicitPct: d3.sum(v, d => d.explicit ? 1 : 0) / v.length * 100,
    avgDuration: d3.mean(v, d => d.track_duration_min),
    avgPopularity: d3.mean(v, d => d.track_popularity)
  }),
  d => categorizeGenre(parseGenres(d.artist_genres))
);
```

### D3.js Specific Implementation

**For Stacked Area Chart**:
```javascript
// Create stack generator
const stack = d3.stack()
  .keys(topGenres.concat(['other']))
  .order(d3.stackOrderNone)
  .offset(d3.stackOffsetNone);

const series = stack(stackData);

// Create area generator
const area = d3.area()
  .x(d => xScale(d.data.year))
  .y0(d => yScale(d[0]))
  .y1(d => yScale(d[1]))
  .curve(d3.curveMonotoneX);

// Render areas
svg.selectAll('.genre-area')
  .data(series)
  .join('path')
  .attr('class', 'genre-area')
  .attr('d', area)
  .attr('fill', d => genreColors[d.key]);
```

**For Hexbin Density Plot**:
```javascript
// Create hexbin generator
const hexbin = d3.hexbin()
  .x(d => xScale(d[0]))
  .y(d => yScale(d[1]))
  .radius(15)
  .extent([[0, 0], [width, height]]);

const bins = hexbin(hexbinData);

// Color scale based on density
const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
  .domain([0, d3.max(bins, d => d.length)]);

// Render hexagons
svg.selectAll('.hexagon')
  .data(bins)
  .join('path')
  .attr('class', 'hexagon')
  .attr('d', hexbin.hexagon())
  .attr('transform', d => `translate(${d.x},${d.y})`)
  .attr('fill', d => colorScale(d.length));
```

**For Grouped Bar Chart**:
```javascript
// Prepare data for grouped bars
const metrics = ['explicitPct', 'avgDuration', 'avgPopularity'];
const genreArray = Array.from(genreStats, ([genre, stats]) => ({
  genre,
  ...stats
}));

// X scale for genres
const x0 = d3.scaleBand()
  .domain(genreArray.map(d => d.genre))
  .range([0, width])
  .padding(0.2);

// X scale for metrics within genre
const x1 = d3.scaleBand()
  .domain(metrics)
  .range([0, x0.bandwidth()])
  .padding(0.05);

// Render grouped bars
svg.selectAll('.genre-group')
  .data(genreArray)
  .join('g')
  .attr('class', 'genre-group')
  .attr('transform', d => `translate(${x0(d.genre)},0)`)
  .selectAll('.bar')
  .data(d => metrics.map(metric => ({
    metric,
    value: d[metric],
    genre: d.genre
  })))
  .join('rect')
  .attr('class', 'bar')
  .attr('x', d => x1(d.metric))
  .attr('y', d => yScale(d.value))
  .attr('width', x1.bandwidth())
  .attr('height', d => height - yScale(d.value))
  .attr('fill', d => metricColors[d.metric]);
```

### Performance Considerations

- **Hexbin**: 8,582 points → ~100-200 hexagons (huge performance gain)
- **Area Chart**: Aggregated to ~17 years × 8 genres = 136 data points (very fast)
- **Bar Chart**: Top 10-12 genres × 3 metrics = 30-36 bars (instant render)
- All visualizations should render smoothly without canvas fallback needed

### Key Questions Each Visualization Answers

**Stacked Area Chart** (Temporal Evolution):
1. ✅ **Has music release volume increased over time?**
   - Hypothesis: YES - Data shows surge from ~300 tracks (2012) to 765 (2025)
   - Visualization will show growth curve clearly

2. ✅ **Which genres have grown or declined?**
   - Hypothesis: Pop remains dominant, hip hop growing, rock declining?
   - Area thickness over time reveals genre trajectory

3. ✅ **When were peak years for music releases?**
   - Hypothesis: Recent years (2023-2025) show surge
   - Visual peaks in stacked areas show volume spikes

**Hexbin Density Plot** (Fame vs Success):
4. ✅ **Does artist fame guarantee track popularity?**
   - Hypothesis: MODERATE correlation (0.467)
   - High density at top-right = yes, but density spread shows exceptions

5. ✅ **Can unknown artists produce popular tracks?**
   - Hypothesis: YES - "sleeper hits" exist
   - Hexagons in bottom-right corner = low followers, high popularity

6. ✅ **Do mega-stars ever produce flops?**
   - Hypothesis: YES - even top artists have misses
   - Hexagons in top-left corner = high followers, low popularity

**Grouped Bar Chart** (Genre Characteristics):
7. ✅ **Which genres have more explicit content?**
   - Hypothesis: Hip hop/rap > rock > pop > country
   - Red bars (explicit %) reveal genre differences

8. ✅ **Are certain genres' tracks longer?**
   - Hypothesis: Rock and folk longer than pop and hip hop
   - Blue bars (duration) show length patterns by genre

9. ✅ **Which genres achieve higher average popularity?**
   - Hypothesis: Pop and hip hop > rock and folk
   - Green bars (popularity) reveal genre success rates

### Expected Insights Summary

**From Area Chart**:
- Music industry growth trajectory 2009-2025
- Genre dominance shifts (e.g., hip hop overtaking rock?)
- Impact of streaming era on release patterns

**From Hexbin Plot**:
- Strong but imperfect fame-success relationship
- Outliers: viral unknowns and famous flops
- Density clusters reveal "typical" patterns vs exceptions

**From Bar Chart**:
- Genre stereotypes confirmed/debunked by data
- Explicit content varies dramatically by genre
- Genre-specific patterns in duration and popularity 