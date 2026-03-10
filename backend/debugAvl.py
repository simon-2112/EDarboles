from models.AvlTree import AvlTree
from models.Node import Node


def main():

    tree = AvlTree()

    values = [10, 20, 30, 40, 50, 25]

    print("INSERTANDO NODOS\n")

    for v in values:
        print(f"\nInsertando {v}")
        tree.insert(Node(v))

        print("Árbol actual:")
        tree.print_tree()

    print("\n====================")
    print("RECORRIDOS")
    print("====================")

    print("BFS:", tree.breadthFirstSearch())

    print("InOrder:",
        [node.getValue() for node in tree.inOrderTraversal()])

    print("PreOrder:",
        [node.getValue() for node in tree.preOrderTraversal()])

    print("PostOrder:",
        [node.getValue() for node in tree.posOrderTraversal()])

    print("\nAVL válido:", tree.validate_avl())

    print("\n====================")
    print("ELIMINACIONES")
    print("====================")

    deletes = [40, 10]

    for d in deletes:
        print(f"\nEliminando {d}")
        tree.delete(d)

        print("Árbol actual:")
        tree.print_tree()

        print("AVL válido:", tree.validate_avl())


if __name__ == "__main__":
    main()