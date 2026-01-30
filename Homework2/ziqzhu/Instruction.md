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

## Visualization Ideas (Data-Driven)

### Current Implementation
1. **Bar Chart - Top Artists by Followers** (Overview, Fundamental) ✅
   - Shows the 15 most followed artists
   - **Why it works**: Artist distribution is highly skewed (Taylor Swift: 324 tracks, 145M followers)
   - Visual encoding: Position (x=artist, y=followers), Length (bar height)

### Recommended Additional Visualizations

Based on data exploration, here are the best visualization options:

#### **Option A: Temporal + Popularity Analysis** (RECOMMENDED)

2. **Stacked Area Chart / Timeline - Music Release Trends Over Time** (Advanced)
   - **What to show**: Track releases over time (1952-2025), stacked by genre or album type
   - X-axis: Year (focus on 2009-2025 where data is dense)
   - Y-axis: Number of tracks released
   - Stacked by: Top 5-7 genres (pop, country, hip hop, rock, indie) + "other"
   - **Why valuable**:
     - Shows temporal evolution of music landscape
     - Data has strong temporal dimension (765 tracks in 2025, 648 in 2024)
     - Reveals genre trends over 15+ years
   - **Encoding**: Area/position for quantity over time, color hue for genre categories

3. **Scatter Plot with Marginal Distributions - Popularity vs Duration Analysis**
   - X-axis: Track duration (minutes)
   - Y-axis: Track popularity (0-99)
   - Color: Explicit content (red/orange for explicit, blue/green for clean)
   - Size: Artist followers (to show established vs emerging artists)
   - **Optional**: Add marginal histograms on both axes
   - **Why valuable**:
     - Tests hypothesis: Do explicit tracks have higher popularity? (YES: Q4 has 32% explicit vs Q1 15%)
     - Do longer tracks perform better? (YES: weak correlation 0.106, popular tracks avg 3.65min vs 3.33min)
     - Shows outliers (13+ minute tracks, 0 popularity tracks)
   - **Encoding**: 2D position for correlation, color for categorical, size for continuous dimension

#### **Option B: Genre Landscape** (Alternative Advanced)

2. **Packed Circle Chart / Bubble Chart - Genre Ecosystem**
   - **What to show**: Top 20-30 genres as circles
   - Circle size: Number of tracks in genre
   - Circle color: Average popularity of tracks in genre (sequential scale)
   - **Why valuable**:
     - 430 unique genres but top 30 account for majority
     - Clear size hierarchy (pop: 920, country: 680, soundtrack: 450)
     - Shows which genres are both common AND popular
   - **Encoding**: Area for quantity, color intensity for average popularity

3. **Grouped/Stacked Bar Chart - Genre Characteristics**
   - X-axis: Top 10 genres
   - Y-axis: Percentage/Count
   - Bars show: Explicit %, Average duration, Average popularity
   - **Why valuable**:
     - Compares genre characteristics side-by-side
     - Shows if certain genres have more explicit content
     - Reveals genre-specific patterns in duration and popularity

#### **Option C: Multi-dimensional Deep Dive**

2. **Hexbin Density Plot - Popularity vs Artist Followers**
   - X-axis: Artist followers (log scale)
   - Y-axis: Track popularity
   - Color: Density of tracks (sequential)
   - **Why valuable**:
     - Shows if big artists always produce popular tracks
     - Moderate correlation (0.467) suggests interesting patterns
     - Hexbin handles overplotting with 8,582 tracks
   - **Advanced technique**: Hexagonal binning for density visualization

3. **Small Multiples - Album Type Comparison**
   - Three scatter plots side-by-side (album, single, compilation)
   - Each shows: Popularity vs Duration
   - **Why valuable**:
     - Reveals if singles are shorter/more popular than albums
     - Album types have different distributions (68% albums, 26% singles, 6% compilations)
     - Allows pattern comparison across categories

### Recommended Dashboard Design (Data-Driven)

**Three-view layout** following Overview → Temporal Context → Detail pattern:

### **PRIMARY RECOMMENDATION**

1. **Bar Chart - Top 15 Artists by Followers** [✅ COMPLETED]
   - **Role**: Overview, entry point
   - **Shows**: The most influential artists (Taylor Swift: 145M, Ed Sheeran: 123M, etc.)
   - **Dimension**: Artist-level aggregation
   - **Encoding**: Length (highly effective for comparing magnitudes)

2. **Stacked Area Chart - Music Trends Over Time (2009-2025)** (Advanced)
   - **Role**: Temporal context, shows evolution
   - **Shows**: How music releases and genres have evolved over 15+ years
   - Stack by: Top 6-7 genres (pop, country, hip hop, rock, indie, folk, rap)
   - **Why it's advanced**: Area stacking algorithm, temporal aggregation, smooth transitions
   - **Dimension**: Time-series, genre distribution
   - **Data insight**: 765 tracks in 2025, 648 in 2024 - shows recent surge
   - **Encoding**: Area for quantity, position for trend, hue for genre categories

3. **Scatter Plot - Track Popularity vs Duration with Explicit Content**
   - **Role**: Detail analysis, hypothesis testing
   - **Shows**: Are explicit/longer tracks more popular? (Answer: YES to both)
   - X-axis: Duration (3.49min avg), Y-axis: Popularity (52.4 avg)
   - Color: Explicit (25% of tracks) - use red/blue diverging
   - Size: Artist followers (shows if track benefits from artist fame)
   - **Dimension**: Track-level, bi-variate correlation
   - **Data insight**: Explicit tracks 2x more common in high popularity quartile
   - **Encoding**: Position for correlation, color for category, size for influence

**Why this combination is optimal:**
- ✅ **Different aggregation**: Artist → Time-Genre → Individual Tracks
- ✅ **Different question types**: Who dominates? → How has it changed? → What makes tracks popular?
- ✅ **Advanced technique**: Stacked area chart with temporal aggregation
- ✅ **Overview + Detail**: Bar chart (overview) + Area (context) + Scatter (detail)
- ✅ **Data-driven**: Each viz addresses actual patterns found in exploration
- ✅ **HW2 requirements**: All criteria met, fits fullscreen

### **ALTERNATIVE: Genre-Focused Dashboard**

If you prefer static genre analysis over temporal:

1. **Bar Chart - Top Artists by Followers** [✅ COMPLETED]
2. **Packed Circles / Bubble Chart - Genre Landscape** (Advanced)
   - Shows 430 genres hierarchically
   - Size: track count, Color: avg popularity
3. **Hexbin Density Plot - Popularity vs Artist Followers**
   - Advanced hexagonal binning
   - Shows correlation (0.467) and outliers
   - Handles 8,582 points elegantly

### Visual Encoding & Design Rationale

**Effectiveness Hierarchy** (following Munzner's principles):
1. **Position** (most effective): Used for all quantitative comparisons (followers, time, popularity, duration)
2. **Length**: Bar chart heights for follower counts
3. **Area**: Stacked area chart for temporal genre volumes
4. **Color Hue**: Categorical data (genres, explicit/clean)
5. **Color Saturation**: Quantitative data (popularity, density)
6. **Size**: Secondary quantitative dimension (artist followers in scatter)

**Color Palette Design:**
- **Genres**: Qualitative color scale (D3.schemeCategory10 or schemeTableau10)
  - Pop: Pink/Purple
  - Hip Hop: Orange
  - Rock: Red
  - Country: Brown
  - Indie: Green
  - Folk: Yellow-green
- **Explicit content**: Diverging semantic colors
  - Explicit: Red/Orange (warning, adult)
  - Clean: Blue/Green (safe, general)
- **Popularity**: Sequential yellow-to-red (more popular = "hotter")
- **Branding**: Spotify green (#1db954) for headers and accents

**Accessibility:**
- Use colorblind-safe palettes
- Don't rely solely on color - also use position, size, shape
- Provide clear legends and axis labels
- Ensure sufficient contrast ratios

### Future Interactivity (HW3 Planning)

**Primary Recommendation Dashboard:**
1. **Bar chart**: Click artist → filter other views to that artist's tracks only
2. **Area chart**:
   - Brush to select time range → update scatter to show only tracks from that period
   - Click genre in legend → highlight that genre in all views
3. **Scatter plot**:
   - Lasso selection → highlight corresponding regions in area chart
   - Hover → show track name, artist, popularity details
4. **Cross-filtering**: All selections update all views simultaneously

**Coordinated Views:**
- Linked highlighting across all three visualizations
- Temporal brushing to explore how popularity patterns change over time
- Genre filtering to compare explicit content across genres

---

## Implementation Notes

### Data Processing Considerations

1. **Genre parsing**: `artist_genres` contains comma-separated strings that need parsing
   - 39.2% of tracks have missing genre data - decide how to handle (filter out or show as "Unknown")
   - 430 unique genres - may want to group into broader categories

2. **Date parsing**: `album_release_date` needs conversion to datetime for temporal visualization
   - Data spans 1952-2025 but focus on 2009-2025 for better density
   - Consider grouping by year, quarter, or month depending on granularity needed

3. **Outliers**: Some extreme values exist
   - Duration: 0.07min to 13.51min (may want to filter out very short/long)
   - Popularity: Many 0-value tracks (consider filtering for meaningful analysis)

4. **Performance**: With 8,582 tracks:
   - Scatter plot: Fine to render all points (consider opacity for overplotting)
   - Area chart: Aggregate by time period (year/quarter is sufficient)
   - Consider using canvas instead of SVG for large scatter plots if performance issues

### D3.js Specific Tips

- Use `d3.stack()` for the stacked area chart
- Use `d3.scaleTime()` for temporal x-axis
- Use `d3.scaleLog()` for artist followers if using log scale
- For genre parsing: `d3.csv()` with custom accessor function
- Consider `d3.interpolateCatmullRom()` for smooth area curves

### Testing Hypotheses (for write-up)

Your visualizations should help answer:
1. ✅ Do explicit tracks have higher popularity? (Data says YES: 32% in Q4 vs 15% in Q1)
2. ✅ Are longer tracks more popular? (Data says SLIGHTLY: 0.106 correlation)
3. ✅ Which genres dominate modern music? (Data says: Pop > Country > Hip Hop)
4. ✅ Has music release volume increased? (Data says YES: 765 in 2025 vs ~300 in 2012)
5. ✅ Does artist fame guarantee track success? (Data says MODERATE: 0.467 correlation) 