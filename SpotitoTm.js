const axios = require('axios');
const fs = require('fs');

// Configuraciones
const spotifyClientID = 'TU_CLIENT_ID';
const spotifyClientSecret = 'TU_CLIENT_SECRET';
const playlistID = 'TU_PLAYLIST_ID';
const telegramToken = 'TOKEN_TELEGRAM';
const telegramChatID = 'CHAT_ID';

// Función para obtener el token de Spotify
async function getSpotifyToken() {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(spotifyClientID + ':' + spotifyClientSecret).toString('base64')
        },
        params: { grant_type: 'client_credentials' }
    });
    return response.data.access_token;
}

// Obtener canciones de la playlist
async function getNewSongs() {
    const token = await getSpotifyToken();
    const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistID}/tracks`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = response.data.items;
    const songList = data.map(track => track.track.name + ' - ' + track.track.artists.map(artist => artist.name).join(', '));
    
    // Leer archivo local con las últimas canciones
    const savedSongs = fs.existsSync('last_songs.json') ? JSON.parse(fs.readFileSync('last_songs.json')) : [];
    
    // Encontrar canciones nuevas
    const newSongs = songList.filter(song => !savedSongs.includes(song));
    
    if (newSongs.length > 0) {
        // Guardar lista actualizada
        fs.writeFileSync('last_songs.json', JSON.stringify(songList));
        return newSongs;
    }
    return null;
}

// Enviar mensaje a Telegram
async function sendTelegramMessage(songs) {
    const message = `Nuevas canciones añadidas:\n${songs.join('\n')}`;
    await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        chat_id: telegramChatID,
        text: message
    });
}

// Ejecutar el flujo
(async () => {
    const newSongs = await getNewSongs();
    if (newSongs) await sendTelegramMessage(newSongs);
})();
