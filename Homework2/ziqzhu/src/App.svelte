<script lang="ts">
  import AreaChart from './components/AreaChart.svelte'
  import HexbinChart from './components/HexbinChart.svelte'
  import GenreBarChart from './components/GenreBarChart.svelte'
</script>

<main>
  <header>
    <h1>Spotify Music Dashboard</h1>
    <p class="subtitle">Visualization of Global Music Data (2009-2025)</p>
  </header>

  <div class="dashboard">
    <section class="chart-section">
      <h2>Music Trends Over Time (2009-2025)</h2>
      <AreaChart />
    </section>

    <section class="chart-section">
      <h2>Artist Fame vs Track Success</h2>
      <HexbinChart />
    </section>

    <section class="chart-section">
      <h2>Explicit vs Clean Content by Genre</h2>
      <GenreBarChart />
    </section>
  </div>
</main>

<style>
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  header {
    text-align: center;
    margin-bottom: 30px;
  }

  h1 {
    font-size: 2.5rem;
    color: #1db954;
    margin-bottom: 10px;
  }

  .subtitle {
    font-size: 1.1rem;
    color: #666;
    margin: 0;
  }

  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  .chart-section {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .chart-section h2 {
    margin: 0 0 15px 0;
    font-size: 1.5rem;
    color: #333;
    font-weight: 600;
  }
</style>
