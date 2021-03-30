#!/usr/bin/perl -w
use strict;

my($out);
open $out, ">Plantago.js" || die "Can't open output file\n";
print $out "\xEF\xBB\xBF";

my @files = <plantago-parts/*.js>;
$/ = undef;

foreach my $file (@files) {
  open my ($fh), $file;
  $_ = <$fh>;
  close $fh;
  s/^\xEF\xBB\xBF//;
  print $out $_;
}

close $out;
exit 0;
