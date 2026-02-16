import { useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import Streamgraph from './components/Streamgraph';
import ParallelCoordinates from './components/ParallelCoordinates';
import DurationScatter from './components/DurationScatter';
import type { SpotifyRow, AlbumTypeCount } from './types';

const albumTypeColors: Record<string, string> = {
  album: '#2a6fdb',
  single: '#f59e0b',
  compilation: '#9c4dcc'
};

function App() {
  const [data, setData] = useState<SpotifyRow[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    d3.csv<SpotifyRow>('/data/spotify_data clean.csv', (d: d3.DSVRowString<string>) => ({
      track_id: d.track_id || '',
      track_name: d.track_name || '',
      track_number: Number(d.track_number) || 0,
      track_popularity: Number(d.track_popularity) || 0,
      explicit: d.explicit === 'TRUE',
      artist_name: d.artist_name || '',
      artist_popularity: Number(d.artist_popularity) || 0,
      artist_followers: Number(d.artist_followers) || 0,
      artist_genres: d.artist_genres || '',
      album_id: d.album_id || '',
      album_name: d.album_name || '',
      album_release_date: d.album_release_date || '',
      album_total_tracks: Number(d.album_total_tracks) || 0,
      album_type: (d.album_type || 'unknown').toLowerCase(),
      track_duration_min: Number(d.track_duration_min) || 0,
      release_year: new Date(d.album_release_date || '').getFullYear() || 0
    })).then((rows: SpotifyRow[]) => {
      const cleaned = rows.filter((row: SpotifyRow) =>
        row.release_year > 0 &&
        !Number.isNaN(row.release_year) &&
        row.artist_followers >= 0 &&
        row.track_duration_min > 0
      );
      setData(cleaned);
    });
  }, []);

  const albumTypes = useMemo(() => {
    const types = Array.from(new Set(data.map((d: SpotifyRow) => d.album_type)))
      .filter((t) => t !== 'unknown');
    return types.length ? types : ['album', 'single', 'compilation'];
  }, [data]);

  const albumTypeCounts = useMemo<AlbumTypeCount[]>(() => {
    const counts = d3.rollups(
      data,
      (v: SpotifyRow[]) => v.length,
      (d: SpotifyRow) => d.album_type
    ).map(([type, count]: [string, number]) => ({ type, count }));
    return counts.sort((a: AlbumTypeCount, b: AlbumTypeCount) => b.count - a.count);
  }, [data]);

  const handleTypeClick = (type: string) => {
    setSelectedType((prev: string | null) => (prev === type ? null : type));
  };

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1>Spotify Dashboard (HW3)</h1>
          <p className="subtitle">Streamgraph + Parallel Coordinates + Duration Histogram</p>
        </div>
        <div className="filter-panel">
          <p className="filter-title">Click a category to filter/highlight</p>
          <div className="filter-row">
            {albumTypeCounts.map((item) => (
              <button
                key={item.type}
                className={`filter-chip ${selectedType === item.type ? 'active' : ''}`}
                style={{ borderColor: albumTypeColors[item.type] || '#999' }}
                onClick={() => handleTypeClick(item.type)}
              >
                <span
                  className="chip-dot"
                  style={{ background: albumTypeColors[item.type] || '#999' }}
                />
                {item.type} ({item.count})
              </button>
            ))}
            {selectedType && (
              <button className="filter-chip clear" onClick={() => setSelectedType(null)}>
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="grid">
        <article className="panel">
          <h2>Album Releases Over Time (Streamgraph)</h2>
          <Streamgraph
            data={data}
            albumTypes={albumTypes}
            colors={albumTypeColors}
            selectedType={selectedType}
            onSelectType={handleTypeClick}
          />
        </article>

        <article className="panel">
          <h2>Artist Reach vs Track Profile (Parallel Coordinates)</h2>
          <ParallelCoordinates
            data={data}
            albumTypes={albumTypes}
            colors={albumTypeColors}
            selectedType={selectedType}
          />
        </article>

        <article className="panel">
          <h2>Track Duration vs Popularity (Zoom + Pan)</h2>
          <DurationScatter
            data={data}
            colors={albumTypeColors}
            selectedType={selectedType}
          />
        </article>
      </section>
    </main>
  );
}

export default App;
