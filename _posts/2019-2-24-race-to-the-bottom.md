---
title:  "The race to the bottom of the depth first search"
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
`EXIT`, or they would be performed at the same time.

|![](/assets/images/glass.gif){: .align-center}|
|:--:|
|Our stream recalls one lousy frame at a time, slowly floating up to the base case.|

This is a good time to indulge a bad habit. Every time I use streams, I end up
adding `.parallel()` somewhere in the pipeline for gits and shiggles. Sometimes
it breaks, sometimes it doesn't, and sometimes it ends up somewhere between...

```
return IntStream.range(0,compass.length())
  .parallel() // right here
  .mapToObj( s -> compass.charAt(s) + walk(y+senses[s][0],x+senses[s][1]) )
  .filter( s -> s.charAt(s.length()-1) == EXIT )
  .findAny()
  .orElse(Character.toString(map[y][x]));
```

...enter the parallel DFS. Instead of finding paths in the arbitrary encounter
order of the compass, we start a recursive race to the exit, and find paths in
the encounter order of the time they take to return. In general, longer paths
take longer to find. As a result, the parallel DFS finds the shortest traversal
of `map` in most of my tests.

|![](/assets/images/galton.gif){: .align-center}|
|:--:|
|The race is on, our streams spread through ForkJoinPool to the base case.|

This result is still far from what I would consider reliable. I do not have a
good enough understanding of the Java stream thread pool, or multithreading in
general, to guarantee the result is of minimal length, and I have seen
[recursive streams backfire before]({% post_url 2019-2-21-recursive-streams-addendum %}).
There are a number of tasks I'll have to complete to better understand this:

- implement a breadth first search
- randomly generate solvable maps (done as of Feb. 25th)
- compare the results of sequential DFS, parallel DFS, and sequential BFS
- explore parallel BFS?

which I may or may not end up pursuing.

---

My understanding of the behavior of recursive parallel streams may be foggy,
but the intuition behind it is clear and beautiful. With a single intermediate
operation, we have transformed an ordered traversal of moves in memory space
into an ordered traversal of threads in runtime. Considering this solution does
not require a queue or extra data structure like a BFS, and seems to minimize
*something* dependent on the length of its path, it may as well be useful in
its own right.
