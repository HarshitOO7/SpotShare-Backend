import axios from 'axios';

const getCoordinates = async (address) => {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: process.env.GOOGLE_MAPS_API_KEY 
            }
        });

        // MED-5: Guard against empty results (invalid address) to avoid TypeError
        if (!response.data.results?.length) {
            throw new Error('Address not found — no results from geocoding API');
        }
        const { lat, lng } = response.data.results[0].geometry.location;
        return { lat, lng };
    } catch (error) {
        console.error('Error getting coordinates:', error);
        throw new Error('Failed to get coordinates');
    }
};

export { getCoordinates };
