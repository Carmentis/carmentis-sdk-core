import { ResolutionNode } from '../type/valibot/resolutionNodes/ResolutionNodes';
import { ResolverPath } from '../resolver/ResolverPath';
import { MappedNode } from '../resolver/ResolverTypes';

export class ResolverNodeMapper {
    constructor(private readonly nodes: Map<string, ResolutionNode[]>) {}

    map(path: ResolverPath): MappedNode[] {
        const list = [];
        for (let depth = 0, currentPath = path; currentPath.length(); depth++) {
            for (const [ key, nodeList ] of this.nodes) {
                const nodePath = ResolverPath.fromSerialized(key);
                if (nodePath.isEqual(currentPath)) {
                    for (const node of nodeList) {
                        const entry: MappedNode = {
                            depth,
                            path: nodePath.getPath(),
                            node,
                        };
                        list.push(entry);
                    }
                }
            }
            currentPath.removeLast();
        }
        return list;
    }
}
