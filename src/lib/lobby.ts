export function generateInviteLink(lobbyId: string) {
    return {
        appLink: `dosroyale://invite/lobby/${lobbyId}`,
        webLink: `https://dosroyale.app/invite/${lobbyId}`
    };
}