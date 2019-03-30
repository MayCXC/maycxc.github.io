---
title:  "Pretending there are pointers in Java"
date:   2019-3-29 8:00:00 -0500
categories: Java
tags: jdk8 generics inheritance pointers
---

Values. References. Value of a reference? Reference to a value? Value of a
value? Reference to a reference? Pass by value, or pass by reference? Pass
reference by value, or pass value by reference? Am I making sense? I have tried
my hardest not to.

Java is a pass by value language. You can not operate on references in Java.
This means that there is no way to change the value of a variable you pass to
a method from within that method. At least, not until you read the
[docs on generic types:](https://docs.oracle.com/javase/tutorial/java/generics/types.html)

{% highlight java %}
public class Box<T> {
	private T t;
	public Box(T t) {
		set(t);
	}
	public Box() {
		this(null);
	}
	public T get() {
		return t;
	}
	public void set(T t) {
		this.t = t;
	}
}
{% endhighlight %}

And now you can... kind of. It also seems like a `public final Box` could
replace the silly getter-setter pattern we normally use to reveal our privates.
More on that later. For now, what kind of useful things can we do with our new
"pseudo-references"?

In C, we can use pointers to pointers to simplify some operations on graph
structures. Typically, those graphs are made of a bunch of nodes that store
pointers to each other. By storing a pointer to a pointer to a node when
traversing graphs of these linked nodes, we can avoid storing a "last" or
"next" pointer to a node when inserting or deleting nodes in a graph. Too bad
we can't do something like that in Java...

{% highlight java %}
class Node<T> extends Box<T> {
	public final Box<Node<T>> next;
	public Node(T t, Node<T> n) {
		super(t);
		next = new Box<>(n);
	}
}
{% endhighlight %}

Well, a `Node` stores a reference to some type of variable. `Box` did the same
exact thing. Now we can get all UML with it and say a `Node` *is a* `Box` and
should, therefore, `extend` it. That pointer to a pointer in C allows us to
change the value of `next` without storing a reference to two nodes, so we can
store a boxed node and do the same thing. Okay, now what?

{% highlight java %}
public class Stack<T> extends Box<Node<T>> {
	public void giveFirst(T t) {
		set(new Node<>(t,get()));
	}

	public T takeFirst() {
		Node<T> n = get();
		if(n == null) return null;
		set(n.next.get());
		return n.get();
	}
}
{% endhighlight %}

We make a stack with them, I guess. A stack would normally be a reference to a
reference, here it is a box of a box. No ambiguous pushing or popping; give and
take is easier to grok. Most importantly, no branches or cases in `giveFirst`.
Nice. What about a queue?

{% highlight java %}
public class Queue<T> extends Stack<T> {
	private Box<Node<T>> last;

	@Override
	public void giveFirst(T t) {
		super.giveFirst(t);
		if(get().next.get() == null)
			last = get().next;
	}

	public void giveLast(T t) {
		if(get() == null) {
			super.giveFirst(t);
			last = get().next;
		}
		else {
			last.set(new Node<>(t,null));
			last = last.get().next;
		}
	}
}
{% endhighlight %}

Really a dequeue, but there is nothing a stack can do that a queue can't do, so
why remove functionality when we can extend it? This could probably be a little
bit prettier, but I see no way around the special cases where last is changed
when the first node is added. Notice that `last` is not `final`; we would have
to make it a `Box<Box<Node<T>>` to avoid changing the actual links between
nodes, which seemed a little excessive.

---


Well that's that. You don't get pointer arithmetic, but in the past I have done
something similar with one length arrays. You do get a sane way to add mutable
behaviors to classes, instead of the humiliating
`private Foo f; public Foo getFoo(); public void setFoo(Foo f);`
pattern they teach in school. Finally, you get the groundwork for reference
based data type implementations, and a functioning stack and queue, in about
twenty five sloc. Now gib internship pls, I know how to makes the codes :^)
