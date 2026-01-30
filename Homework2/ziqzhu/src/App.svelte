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
    <section class="chart-section full-width">
      <AreaChart />
    </section>

    <section class="chart-section">
      <HexbinChart />
    </section>

    <section class="chart-section">
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
    display: grid;
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .chart-section {
    background: white;
    border-radius: 8px;
    padding: 10px;
  }

  .placeholder {
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border: 2px dashed #ddd;
  }

  .placeholder-content {
    text-align: center;
    color: #999;
  }

  .placeholder-content h3 {
    margin-bottom: 10px;
  }

  .full-width {
    grid-column: 1 / -1;
  }

  @media (min-width: 1200px) {
    .dashboard {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
    }
  }
</style>
