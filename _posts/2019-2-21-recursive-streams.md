---
title:  "Recursive streams in Java 8 for the try-hard homework assignee"
date:   2019-02-21 6:30:00 -0500
categories: Java jdk8 streams recursion homework
---

We were taught Scala in CSC110, and I quickly fell in love with the language.
Now that I am taking introductory Java courses, I need to carefully hide my
love for Scala from the Object Oriented supremacists that grade me. One of the
ways I subtly express it is by using Java 8 functional interfaces wherever
possible, which mostly means replacing all of the iteration I can with Stream
operations. Today, this quest lead to me explore some new methods of recursion,
and uncover some feats and shortcomings of Java 8 in the process.

It all started off with a pretty standard recursion assignment: Write a method
that takes a `java.io.File` parent directory and a `String` filename as its
arguments, and returns a `java.io.File` with a matching name and directory.

We can elaborate and classify this problem as a depth-first search, but doing
so is kind of pointless when the goal is to find any matching filename. We just
need a method that checks every file in a directory for a matching filename,
continues into every directory in that directory, and repeats.

{% highlight java %}
public static File findFile(File f, String fname)
{
  if(f.isFile() && f.getName().equals(fname))
    return f;
  else if(f.isDirectory()) {
    for(File l: f.listFiles()) {
      File r = findFile(l,fname);
      if(r != null)
        return r;
    }
  }
  return null;
}
{% endhighlight %}

Cool, whatever, it passed the test cases. The Java 8 opportunities here are the
for loop and the null check, which I can replace with `Stream` and `Optional`.
The tricky part I had not seen before was the recursion within the loop, which
translates to recursion within the intermediate operations of `Stream`. With
that in mind:

{% highlight java %}
public static File findFile(File dir, String fname)
{
  return Optional // I miss scala
    .ofNullable(dir.listFiles())
    .flatMap( a -> Arrays
      .stream(a)
      .map(r -> findFile(r,fname))
      .filter(Objects::nonNull)
      .findFirst()
    )
    .orElse( fname.equals(dir.getName()) ? dir : null );
}
{% endhighlight %}

Okay, now this is getting somewhere. It feels a little silly to go from null
to Optional and back again in one method frame, but changing the return or
parameter types will probably break the test cases. The standard traits of a
recursive function are all still there; we iterate recursively in the case
of a directory, and compare the filename in the base case.

Still, parts of that method are kind of gross. For starters, the recursion is
awkwardly layered in a Stream beneath an Optional, which itself is crammed
between the condition and the base case. We nest a ternary operator in the last
operation argument, and finding a single file feels oddly specific when
searching directories recursively feels like a pretty common task.

Based on that assumption, we can peel this method apart. Let our problem be
solved with two methods, one to create a recursive `Stream` of all of the files
with the given parent directory, and one to find which of these files has a
given name. This sounds like a much more familiar use of a `Stream`.

{% highlight java %}
static Stream<File> traversal(File f) {
  return Optional
    .ofNullable(f.listFiles())
    .map( a -> Arrays
      .stream(a)
      .flatMap(FindFile::traversal)
    )
    .orElse(Stream.of(f))
    ;
}
{% endhighlight %}

Cool, now we can solve the problem with a filter:

{% highlight java %}
public static File findFile(File dir, String fname) {
  return traversal(dir)
    .filter(f -> fname.equals(f.getName()))
    .findFirst()
    .orElse(null)
    ;
}
{% endhighlight %}

This does not work any better, but it feels more right. Now we can do anything
to all of the files with a given parent directory, not just search for a name,
and we separated the useful null check from the test case requirement.

Two things still bother me: the nested maps, and the static method. Recursion
feels like a less convoluted pattern than passing a method reference two
operations deep, which is what we do now. And I miss Scala functions with no
curly brackets, which look prettier.

So instead, we need a way to recurse from the outer layer of operations, and
recurse on a Functional Interface instance. The answers lie in `public final`
assessors, `this`, and `reduce(Stream::concat)`:

{% highlight java %}
public final Function<File,Stream<File>> traversal = f -> Optional
  .ofNullable(f.listFiles())
  .map(Arrays::stream)
  .orElseGet(Stream::empty)
  .map(this.traversal)
  .reduce(Stream::concat)
  .orElse(Stream.of(f))
  ;
{% endhighlight %}

Which we call with `new FindFile().traversal.apply(dir).filter...` similar to
before.

Okay, I get it, the explicit type is a little cheesy. The chain of operations
is unrolled into a single layer, but it is longer. We transform the Optional
into a Stream before the recursive case, and take advantage of the Optional
result of the reduction to handle the singular file case instead. Unfortunately,
that Optional comes after the recursion. What if we want it at the tail?

{% highlight java %}
public final Function<File,Stream<File>> traversal = f -> Optional
  .ofNullable(f.listFiles())
  .map(Arrays::stream)
  .orElse(Stream.of(f))
  .<File>flatMap( f.isFile() ? Stream::of : this.traversal )
  ;
{% endhighlight %}

Ironically, the ternary operation from the first solution crawled its way back,
but now it handles the recursive case instead of file name matching. Because of
some lame target typing in Java 8, the explicit `<File>` is necessary when the
`flatMap` takes a ternary expression as an argument. Other than all of the
unfortunate hacks we picked up along the way, this is the ideal solution
in my mind: one layer of consecutive intermediate operations, then a condition
to provide the base case. We make use of the file argument in three of the
operations, favoring a singular Stream to a higher order Optional. And, we
demonstrate the true power of functional programming: treating `Stream::of`
and `traversal` as data, considering both their parameter and return types.

So, what did I accomplish here? For one, I have a pretty little helper method
that Streams all of the files that share a given parent directory, which could
be useful. More importantly, I learned to look for opportunities to use ternary
expressions with higher order functions, which could be even more useful. Most
importantly, I have hopefully demonstrated that stubbornly choosing to replace
existing constructs with new ones for the hell of it is a viable learning path,
and one that I encourage you to take. On that note, feel free to reach out to
me with questions, complaints, or job offers... I have too much free time.
