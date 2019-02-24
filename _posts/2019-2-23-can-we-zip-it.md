---
title:  "Can we zip it? (Yes, we can.)"
date:   2019-2-24 5:00:00 -0500
categories: Java jdk8 streams zip replace collect reduce homework
---

Another day, another assignment to overthink.
[Last time]({% post_url 2019-2-21-recursive-streams %}), we used a recursive
flatMap to generate a stream of files with a given parent directory. In today's
episode, we want to replace characters of a string with more readable strings,
the former being a depth first search traversal, and the latter the console
output my professor reads. Once again, our solution will somehow manage to
increase in both quality and crappiness as we try to get Java 8 to play nice.

To set the scene, this project was the classic "find a path through a two
dimensional maze of characters" problem. The instructions said nothing about
finding the shortest path, so I solved it with a simple depth first search. The
path is stored in the form of a string of four unique characters, one for each
direction we stepped towards on the path. This path is useful in other parts of
the code, but reading it is kinda hard, so we expand it:

{% highlight java %}
// path = "NWNNENWWSZ"
System.out.println( path
  .replace("S", "down, ")
  .replace("E", "right, ")
  .replace("N", "up, ")
  .replace("W", "left, ")
  .replace("Z", "exit.")
); // "up, left, up, up, right, up, left, left, down, exit."
{% endhighlight %}

Nothing special, which is a problem. Look at all of those replaces. Repetitive,
borderline redundant replaces. Disgusting. So disgusting that I took the worst
possible approach to replacing the replaces, at least at first.

Before I make those mistakes, I should mention that we declared some `final`
variables to make making mistakes more manageable:

{% highlight java %}
final char SOUTH = 'S', EAST = 'E', NORTH = 'N', WEST = 'W';
final String compass = new String(new char[] {SOUTH, EAST, NORTH, WEST});
// no new String(char...) ;-;
{% endhighlight %}

Alas, Java has no convenient pair or tuple types. If it did, I could probably
just "zip" the array of direction characters with the array of direction words
and pass each resulting tuple to replace. The laziest way to imitate this
pattern in Java is with parallel arrays, or in this case, a parallel string and
string array:

{% highlight java %}
String[] names = {"down", "right", "up", "left", "exit"};
System.out.println( IntStream.range(0, names.length)
  .boxed()
  .reduce( path,
    (s,i) -> s.replace(
      Character.toString((compass+EXIT).charAt(i)),
      names[i] + (i+1==names.length ? "." : ", ")
    ),
    String::concat
  )
);
{% endhighlight %}

Bleh. The idea here was to see the path as the identity of a reduction, and
each replacement as another step in the accumulation. The problem is that we
are dealing with three different types of data; the `String` path, the `char`
directions, and the `int` indices of our arrays. Java is very picky about its
reductions, and wants the input and output data types to be the same:
```
int reduce(int identity, IntBinaryOperator op)
T reduce(T identity, BinaryOperator<T> accumulator)
```
so, we had to box and use the partial reduction meant for parallel streams:
```
<U> U reduce(U identity,
             BiFunction<U, ? super T, U> accumulator,
             BinaryOperator<U> combiner);
```
which left us with a combiner argument that doesn't really do anything, and a
silly ternary expression to split and join each word. That seems like a lot of
work for comma separation...

wait a minute...

__comma__, __separation__...

{% highlight java %}
System.out.println( path.chars()
  .mapToObj(i -> Character.toString((char)i))
  .map((compass + "E")::indexOf)
  .map(i -> names[i])
  .collect(Collectors.joining(", "))
  + "."
);
{% endhighlight %}

Right, that seems pretty obvious in hindsight. I was so caught up on mimicking
the behavior of my first method with a reduction, I forgot the whole point of
functional programming was to manipulate data, and I completely forgot about
`Collectors.joining`, just chillin in `java.util.stream` waiting to solve all
my problems.

Of course, pretty collectors don't exempt us from the Java tax. Today, we paid
in the form of `i -> Character.toString((char)i)` and abusing `indexOf` to get
from a `String` to a `char` to an `int` and back again, functioning as a tiny,
sad map. If our traversal was stored as a collection of `int` indices, or even
cheesier, a `String` of indices as `char` digits, we could get away with only
using one map. But c'mon, using the `+` operator to recursively accumulate the
path is too slick to pass up!

---

This post came up a little lacking. That is because I excluded two of my other
methods that were so misguided, I decided they wouldn't be helpful to share,
even as a learning experience. (hint: they involved `StringBuffer` and
`collect`.) Nonetheless, I think I finally discovered the ultimate lesson I can
learn from a maze project: that shortest path to your goal doesn't always lie
straight ahead. In my next post I'll show that it lies behind a horde of cloned
time travelers.
