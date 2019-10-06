const socket = io.connect('magicmaze') // algo así socket.io era esto

const MYPID = 'uniqueidentifier'

/* Bot action on each game state update */
socket.onUpdate(state => {
    let paths = [];
    state.heroes.forEach(hero => {
        const heroObjectives = searchObjectives(state, hero);
        const heroPaths = heroObjectives.map(o => searchPath(state, o, hero));
        paths = paths.concat(heroPaths);
    })
    paths = prioritizePaths(paths);
    const bestPath = paths[0];
    const firstAction = bestPath.actions[0];
    if (firstAction.owner === MYPID) {
        const sequence = [];
        bestPath.forEach(action => {
            if (action.owner === MYPID) {
                sequence.push(action);
            } else {
                break;
            }
        });
        socket.execute({sequence});
    } else {
        // May be a socket.callToAction(firstAction.owner). Nothing by now.
    }
})

/* Search objectives nearby the hero.
   If any on same tile, return those, otherwise return objectives on adyacent tiles */
const searchObjectives = (state, hero) => {
    const heroObjectives = state.objectives.filter(o => o.heroId === hero.id);
    const onSameTile = heroObjectives.filter(o => o.tileId === hero.tileId);
    if (onSameTile.length > 0) {
        return onSameTile;
    }
    const adyacentTilesIds = state.tiles[hero.tileId].adyacentsTilesIds
    const onAdyacentTiles = heroObjectives.filter(o => adyacentTilesIds.indexOf(o.tileId) !== -1)
    return onAdyacentTiles;
}

/* Search a path of actions to take the hero to the objective */
const searchPath = (state, slotId, hero, ttl = 50) => {
    let path = null;
    const currentSlot = state.slots[slotId]
    if (currentSlot.content === hero) {
        return [];
    }
    if (ttl <= 0) {
        return null;
    }
    const adyacents = computeAdyacents(currentSlotId);
    adyacents.forEach(({ slotId, actionId }) => {
        const candidate = searchPath(modifyState(state, action), slotId, hero, ttl - 1);
        if (candidate !== null) {
            path = candidate.concat([actionId]);
            break;
        }
    });
    return path;
}

const prioritizePaths = (paths) => {
    /* Interactions (eg. [player1, player2, player1, player3] to complete the path */
    const pathInteractions = path => {
        const pathActionsOwners = path.map(actionId => state.actions[actionId].playerId)
        const interactons = pathActionsOwners.reduce((prev, current) => {
            if (prev[prev.length] === current) {
                return prev
            } else {
                return prev.concat(current)
            }
        }, [])
        return interactions;
    };
    /* Less interaction first */
    return paths.sort((p1, p2) => (pathInteractions(p1).length <= pathInteractions(p2).length))
}
