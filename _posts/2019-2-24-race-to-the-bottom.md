---
title:  "Race to the bottom (of the parallel depth first search)"
date:   2019-2-24 7:30:00 -0500
categories: Java
tags: jdk8 streams parallel recursion depth_first_search traversal
---

In my [last post]({% post_url 2019-2-23-can-we-zip-it %}), I mentioned writing
an easy depth first search for an assignment, and hinted that `.parallel()`
may help us find the shortest traversal to the end of a maze. Well, I wasn't
exactly subtle. Given a maze as an array of characters:
```
private char[][] map;
private final char
SOUTH, EAST, NORTH, WEST,
WALL, HALL, EXIT, START,
STEP, CRUMB;
private String compass = new String(new char[] {SOUTH, EAST, NORTH, WEST});
private int[][] senses = { {1,0}, {0,1}, {-1,0}, {0,-1} };
```
we can perform a depth first traversal of `map` to find a path from `START` to
`EXIT`:

{% highlight java %}
private String walk(int y, int x) {
  if(y < 0 || x < 0 || y >= map.length || x >= map[y].length)
    return Character.toString(WALL);

  if(map[y][x] == STEP || map[y][x] == WALL || map[y][x] == EXIT)
    return Character.toString(map[y][x]);

  if(map[y][x] == HALL)
    map[y][x] = STEP;

  return IntStream.range(0,compass.length())
    .mapToObj( s -> compass.charAt(s) + walk(y+senses[s][0],x+senses[s][1]) )
    .filter( s -> s.charAt(s.length()-1) == EXIT )
    .findAny()
    .orElse(Character.toString(map[y][x]));
}
{% endhighlight %}

Things get interesting when you look at that last recursive stream. All four
of the possible moves in our traversal are performed in an arbitrary order.
Ideally, they would be performed in an order more likely to find a path to
`EXIT`, or they would be performed at the same time...
```
return IntStream.range(0,compass.length())
  .parallel()
  .mapToObj( s -> compass.charAt(s) + walk(y+senses[s][0],x+senses[s][1]) )
  .filter( s -> s.charAt(s.length()-1) == EXIT )
  .findAny()
  .orElse(Character.toString(map[y][x]));
```
Enter the parallel DFS. Instead of finding paths in the arbitrary encounter
order of the compass, we start a recursive race to the exit, and find paths in
the encounter order of the time they take return. In general, longer paths
take longer to find. As it turns out, the parallel DFS finds the shortest
traversal of `map` in all of my tests.

This is still far from what I would consider a reliable result. I do not have
a good enough understanding of the Java stream thread pool, or multithreading
in general, to guarantee the result is of minimal length, and I have seen
[recursive streams backfire before]({% post_url 2019-2-21-recursive-streams-addendum %}).
There are a number of tasks I'll have to complete to better understand this -
- implement a breadth first search
- randomly generate solvable maps
- compare the results of sequential DFS, parallel DFS, and sequential BFS
- explore parallel BFS?

which I may or may not be planning on pursuing.

My understanding of the behavior of recursive parallel streams may be foggy,
but the intuition behind it is clear and beautiful. We have transformed an
ordered traversal of moves in a maze into an ordered traversal of the time our
method takes to return. Considering this solution does not require a queue or
extra data structure like a BFS, and seems to minimize *something* dependent on
the length of its path, it may be useful in its own right.
