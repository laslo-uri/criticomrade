package com.ftn.laslouri.criticomrade.util;

import org.springframework.data.domain.PageRequest;

/** Page requests from client parameters: bad values are clamped, not passed to the database. */
public final class Paging {

    private static final int MAX_SIZE = 100;

    private Paging() {
    }

    public static PageRequest of(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_SIZE));
    }
}
