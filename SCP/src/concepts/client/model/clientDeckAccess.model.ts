import type { ClientDeck } from '../client.concept';

/**
 * Client Model Helper Function for Client Deck Access from any Muxified Deck the Client can Utilize.
 */
export const accessClientDeck = (deck: any): ClientDeck => {
  return deck as ClientDeck;
};
