/* eslint-disable @next/next/no-css-tags */

type HeadProps = {
  params: {
    game: string;
  };
};

export default function Head({ params }: HeadProps) {
  const isFlappybird = params.game === 'flappybird';

  return (
    <>
      <link rel="stylesheet" href="/assets/css/style.css" />
      <link rel="stylesheet" href="/assets/css/notifyme.css" />
      {isFlappybird ? (
        <link rel="stylesheet" href="/games/bullcasino/css/flappybird.css" />
      ) : null}
    </>
  );
}
