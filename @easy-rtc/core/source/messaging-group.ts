import { MessagingConnection, MessagingConnectionOptions } from './messaging-connection';
import { DefaultMessageType } from './messaging-handlers';

export type DefaultNodeState = any;

export type MessagingNode<TMessage = DefaultMessageType, TState = DefaultNodeState> = {
  connection: MessagingConnection<TMessage>;
  state: TState;
};

export type MessageGetter<TMessage = DefaultMessageType, TState = DefaultNodeState> = (
  state: TState,
) => TMessage;

export class MessagingGroup<TMessage = DefaultMessageType, TState = DefaultNodeState> {
  static from<TMessage, TSourceState, TState>(
    source: MessagingGroup<TMessage, TSourceState>,
    stateMapper: (
      state: TSourceState,
      index: number,
      array: MessagingNode<TMessage, TSourceState>[],
    ) => TState,
  ) {
    const messagingGroup = new MessagingGroup<TMessage, TState>();

    messagingGroup._nodes = source.nodes.map((node, index, array) => ({
      connection: node.connection,
      state: stateMapper(node.state, index, array),
    }));

    return messagingGroup;
  }

  protected _nodes: MessagingNode<TMessage, TState>[] = [];

  get activeNodes() {
    return this._nodes.filter((node) => node.connection.isActive);
  }

  get nodes() {
    return this._nodes;
  }

  constructor(protected options?: MessagingConnectionOptions) {}

  addNode(...[state]: TState extends {} ? [TState] : [TState?]) {
    this._nodes.push({
      connection: new MessagingConnection<TMessage>(this.options),
      state: state ?? ({} as TState),
    });
  }

  broadcastMessage(messageOrMessageGetter: TMessage | MessageGetter<TMessage, TState>) {
    this.activeNodes.forEach((node) => {
      const message =
        typeof messageOrMessageGetter === 'function'
          ? (messageOrMessageGetter as MessageGetter<TMessage, TState>)(node.state)
          : messageOrMessageGetter;

      node.connection.sendMessage(message);
    });
  }

  closeAllConnections() {
    this.activeNodes.forEach((node) => {
      node.connection.closeConnection();
    });
  }

  removeNode(indexOrConnection: number | MessagingConnection<TMessage>) {
    const index =
      typeof indexOrConnection === 'number'
        ? indexOrConnection
        : this._nodes.findIndex((n) => n.connection === indexOrConnection);

    const [node] = this._nodes.splice(index, 1);

    if (node?.connection.isActive) {
      node.connection.closeConnection();
    }
  }
}
