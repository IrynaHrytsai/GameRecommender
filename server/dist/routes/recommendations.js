import { games } from '../data/games';
export function getRecommendations(likedIds, dislikedIds = [], completedIds = [], limit = 8) {
    if (likedIds.length === 0) {
        return games
            .slice()
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit)
            .map(g => ({ game: g, score: g.rating, matchedTags: [], reason: 'Highly rated by the community' }));
    }
    // Exclude liked, disliked, AND completed from suggestions
    const excludeIds = new Set([...likedIds, ...dislikedIds, ...completedIds]);
    const tagFrequency = {};
    const genreFrequency = {};
    const difficultyPreference = {};
    likedIds.forEach((id, idx) => {
        const recencyWeight = 1 + (idx / likedIds.length) * 0.5;
        const game = games.find(g => g.id === id);
        if (!game)
            return;
        game.tags.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + recencyWeight;
        });
        game.genres.forEach(genre => {
            genreFrequency[genre] = (genreFrequency[genre] || 0) + recencyWeight;
        });
        difficultyPreference[game.difficulty] = (difficultyPreference[game.difficulty] || 0) + 1;
    });
    const results = games
        .filter(g => !excludeIds.has(g.id))
        .map(g => {
        let score = 0;
        const matched = [];
        g.tags.forEach(tag => {
            if (tagFrequency[tag]) {
                score += tagFrequency[tag] * 2;
                matched.push(tag);
            }
        });
        g.genres.forEach(genre => {
            if (genreFrequency[genre]) {
                score += genreFrequency[genre] * 1.5;
            }
        });
        if (difficultyPreference[g.difficulty]) {
            score += difficultyPreference[g.difficulty] * 1.2;
        }
        score += g.rating * 0.5;
        const topMatchedTags = matched
            .sort((a, b) => (tagFrequency[b] || 0) - (tagFrequency[a] || 0))
            .slice(0, 3);
        let reason = '';
        if (topMatchedTags.length > 0) {
            const readableTags = topMatchedTags.map(t => t.replace(/-/g, ' ')).join(', ');
            reason = `Matches your taste for: ${readableTags}`;
        }
        else {
            reason = 'Highly rated game you might enjoy';
        }
        return { game: g, score, matchedTags: matched.slice(0, 4), reason };
    })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    return results;
}
