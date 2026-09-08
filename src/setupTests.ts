import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { Link } from 'react-router';
import { setLink } from '@codegouvfr/react-dsfr/link';
import { createElement } from 'react';

setLink({ Link: props => createElement(Link, {
  ...props,
  to: 'to' in props ? props.to : props.href,
}) });

afterEach(cleanup);
